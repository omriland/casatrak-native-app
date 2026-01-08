import { Platform } from 'react-native'
import { supabase } from './supabase'
import { Property, PropertyInsert, Note, Attachment, AttachmentInsert } from '../types/property'

export async function getProperties(): Promise<Property[]> {
  try {
    console.log('Fetching properties from Supabase...')
    const { data, error } = await supabase
      .from('properties')
      .select('*, attachments(file_path)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    const propertiesWithThumb = data?.map(p => {
      const atts = p.attachments as any[] || []
      return {
        ...p,
        attachment_count: atts.length,
        thumbnail_path: atts.length > 0 ? atts[0].file_path : null
      }
    }) || []

    console.log(`Successfully fetched ${propertiesWithThumb.length} properties`)
    return propertiesWithThumb as Property[]
  } catch (error: any) {
    console.error('Error in getProperties:', error)
    throw error
  }
}
export async function getFlaggedProperties(): Promise<Property[]> {
  try {
    console.log('Fetching flagged properties with notes from Supabase...')
    // We select notes and order them by created_at desc, limit is handled in JS for simplicity
    // but we can try to fetch all and then slice.
    const { data, error } = await supabase
      .from('properties')
      .select('*, attachments(file_path), notes(*)')
      .eq('is_flagged', true)
      .neq('status', 'Irrelevant')
      .order('created_at', { ascending: false })
      .order('created_at', { foreignTable: 'notes', ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    const propertiesWithData = data?.map(p => {
      const atts = p.attachments as any[] || []
      const notes = p.notes as any[] || []
      return {
        ...p,
        attachment_count: atts.length,
        thumbnail_path: atts.length > 0 ? atts[0].file_path : null,
        latest_notes: notes.slice(0, 2) // Only take the last two notes
      }
    }) || []

    return propertiesWithData as Property[]
  } catch (error: any) {
    console.error('Error in getFlaggedProperties:', error)
    throw error
  }
}


export async function getProperty(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createProperty(property: PropertyInsert): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .insert(property)
    .select()

  if (error) {
    console.error('Error creating property:', error)
    throw error
  }

  if (!data || data.length === 0) {
    throw new Error('Property was created but could not be retrieved. Please check your permissions.')
  }

  return data[0]
}

export async function updateProperty(id: string, updates: Partial<PropertyInsert>): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating property:', error)
    throw error
  }

  if (!data || data.length === 0) {
    throw new Error('Property was updated but could not be retrieved. Please check your permissions.')
  }

  return data[0]
}

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function updatePropertyStatus(id: string, status: Property['status']): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update({ status })
    .eq('id', id)
    .select()

  if (error) throw error
  if (!data || data.length === 0) throw new Error('Property status update failed to return data')
  return data[0]
}

export async function getPropertyNotes(propertyId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createNote(propertyId: string, content: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({ property_id: propertyId, content })
    .select()

  if (error) throw error
  if (!data || data.length === 0) throw new Error('Note creation failed to return data')
  return data[0]
}

export async function updateNote(id: string, content: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ content })
    .eq('id', id)
    .select()

  if (error) throw error
  if (!data || data.length === 0) throw new Error('Note update failed to return data')
  return data[0]
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function updatePropertyRating(id: string, rating: number): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update({ rating })
    .eq('id', id)
    .select()

  if (error) throw error
  if (!data || data.length === 0) throw new Error('Rating update failed to return data')
  return data[0]
}

export async function togglePropertyFlag(id: string, isFlagged: boolean): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update({ is_flagged: isFlagged })
    .eq('id', id)
    .select()

  if (error) throw error
  if (!data || data.length === 0) throw new Error('Flag toggle failed to return data')
  return data[0]
}

// --- Attachment Functions ---

export async function getPropertyAttachments(propertyId: string): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function uploadPropertyAttachment(
  propertyId: string,
  file: { uri: string; name: string; type: string; size: number; arrayBuffer?: ArrayBuffer }
): Promise<Attachment> {
  // 1. Upload file to Supabase Storage
  // We use a timestamped name to avoid collisions
  const fileExt = file.name.split('.').pop()
  const fileName = `${propertyId}/${Date.now()}.${fileExt}`
  const filePath = fileName

  try {
    // In React Native, Supabase Storage requires ArrayBuffer, not Blob
    let arrayBuffer: ArrayBuffer

    if (file.arrayBuffer) {
      // Use the provided ArrayBuffer (most efficient)
      arrayBuffer = file.arrayBuffer
      console.log(`Using provided ArrayBuffer: ${file.name}, size: ${arrayBuffer.byteLength} bytes`)
    } else {
      // Fallback: read the file from URI and convert to ArrayBuffer
      try {
        // Ensure URI is properly formatted (add file:// if needed for iOS)
        const uri = file.uri.startsWith('file://') ? file.uri : `file://${file.uri}`

        const response = await fetch(uri)
        if (!response.ok) {
          throw new Error(`Failed to read file: ${response.status} ${response.statusText}`)
        }

        // Convert response to ArrayBuffer directly (more reliable for React Native)
        arrayBuffer = await response.arrayBuffer()

        // Verify arrayBuffer has content
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          console.error('ArrayBuffer is empty, file URI:', file.uri)
          throw new Error('File ArrayBuffer is empty or invalid')
        }

        console.log(`Successfully read file: ${file.name}, size: ${arrayBuffer.byteLength} bytes`)
      } catch (fetchError: any) {
        console.error('Error reading file:', fetchError)
        console.error('File URI:', file.uri)
        console.error('File type:', file.type)
        console.error('File size:', file.size)
        throw new Error(`Failed to read file content: ${fetchError.message || 'Unknown error'}`)
      }
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-attachments')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // 2. Insert metadata into attachments table
    const isPdf = file.type === 'application/pdf'
    const isVideo = file.type?.startsWith('video/')
    const fileType = isPdf ? 'pdf' : (isVideo ? 'video' : 'image')

    const attachment: AttachmentInsert = {
      property_id: propertyId,
      file_name: file.name,
      file_path: filePath,
      file_type: fileType,
      file_size: file.size,
      mime_type: file.type,
    }

    const { data, error: dbError } = await supabase
      .from('attachments')
      .insert(attachment)
      .select()

    if (dbError) throw dbError
    if (!data || data.length === 0) throw new Error('Attachment creation failed to return data')
    return data[0]
  } catch (err) {
    console.error('Upload failure:', err)
    throw err
  }
}

export async function deletePropertyAttachment(id: string, filePath: string): Promise<void> {
  // 1. Delete from Storage
  const { error: storageError } = await supabase.storage
    .from('property-attachments')
    .remove([filePath])

  if (storageError) throw storageError

  // 2. Delete from DB
  const { error: dbError } = await supabase
    .from('attachments')
    .delete()
    .eq('id', id)

  if (dbError) throw dbError
}

export function getPublicUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('property-attachments')
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Formats an address by removing the country name if present
 */
export function formatAddress(address: string | null | undefined): string {
  if (!address) return ''

  const parts = address.split(',')
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim()
    const countries = ['Israel', 'ישראל']

    if (countries.some(country => lastPart.includes(country))) {
      return parts.slice(0, parts.length - 1).join(',').trim()
    }
  }

  return address
}
