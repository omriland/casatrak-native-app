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
    .single()

  if (error) throw error
  return data
}

export async function updateProperty(id: string, updates: Partial<PropertyInsert>): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
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
    .single()

  if (error) throw error
  return data
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
    .single()

  if (error) throw error
  return data
}

export async function updateNote(id: string, content: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ content })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
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
    .single()

  if (error) throw error
  return data
}

export async function togglePropertyFlag(id: string, isFlagged: boolean): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update({ is_flagged: isFlagged })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
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
  file: { uri: string; name: string; type: string; size: number }
): Promise<Attachment> {
  // 1. Upload file to Supabase Storage
  // We use a timestamped name to avoid collisions
  const fileExt = file.name.split('.').pop()
  const fileName = `${propertyId}/${Date.now()}.${fileExt}`
  const filePath = fileName

  try {
    // In React Native, fetch(uri) is the standard way to get a blob from a local file
    const response = await fetch(file.uri)
    const blob = await response.blob()

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-attachments')
      .upload(filePath, blob, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // 2. Insert metadata into attachments table
    const isPdf = file.type === 'application/pdf'
    const attachment: AttachmentInsert = {
      property_id: propertyId,
      file_name: file.name,
      file_path: filePath,
      file_type: isPdf ? 'pdf' : 'image',
      file_size: file.size,
      mime_type: file.type,
    }

    const { data, error: dbError } = await supabase
      .from('attachments')
      .insert(attachment)
      .select()
      .single()

    if (dbError) throw dbError
    return data
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
