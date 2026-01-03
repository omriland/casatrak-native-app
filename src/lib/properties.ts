import { supabase } from './supabase'
import { Property, PropertyInsert, Note } from '../types/property'

export async function getProperties(): Promise<Property[]> {
  try {
    console.log('Fetching properties from Supabase...')
    const { data, error } = await supabase
      .from('properties')
      .select('*, attachments(count)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    const propertiesWithCount = data?.map(p => ({
      ...p,
      attachment_count: (p.attachments as any)?.[0]?.count || 0
    })) || []

    console.log(`Successfully fetched ${propertiesWithCount.length} properties`)
    return propertiesWithCount as Property[]
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
