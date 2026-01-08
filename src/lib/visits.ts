import { supabase } from './supabase'
import { Visit, VisitInsert, VisitUpdate, VisitStatus } from '../types/visit'

/**
 * Get visits for a date range (for calendar month view)
 */
export async function getVisits(startDate: Date, endDate: Date): Promise<Visit[]> {
  try {
    const startISO = startDate.toISOString()
    const endISO = endDate.toISOString()

    const { data, error } = await supabase
      .from('visits')
      .select(`
        *,
        property:properties(id, title, address)
      `)
      .gte('scheduled_at', startISO)
      .lte('scheduled_at', endISO)
      .order('scheduled_at', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return (data || []).map((visit: any) => ({
      ...visit,
      property: visit.property ? {
        id: visit.property.id,
        title: visit.property.title,
        address: visit.property.address,
      } : undefined,
    })) as Visit[]
  } catch (error: any) {
    console.error('Error in getVisits:', error)
    throw error
  }
}

/**
 * Get all visits for a specific property
 */
export async function getVisitsByProperty(propertyId: string): Promise<Visit[]> {
  try {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('property_id', propertyId)
      .order('scheduled_at', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return (data || []) as Visit[]
  } catch (error: any) {
    console.error('Error in getVisitsByProperty:', error)
    throw error
  }
}

/**
 * Get a single visit by ID
 */
export async function getVisit(id: string): Promise<Visit | null> {
  try {
    const { data, error } = await supabase
      .from('visits')
      .select(`
        *,
        property:properties(id, title, address)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    if (!data) return null

    return {
      ...data,
      property: data.property ? {
        id: data.property.id,
        title: data.property.title,
        address: data.property.address,
      } : undefined,
    } as Visit
  } catch (error: any) {
    console.error('Error in getVisit:', error)
    throw error
  }
}

/**
 * Create a new visit
 */
export async function createVisit(visit: VisitInsert): Promise<Visit> {
  try {
    const { data, error } = await supabase
      .from('visits')
      .insert(visit)
      .select(`
        *,
        property:properties(id, title, address)
      `)
      .single()

    if (error) {
      console.error('Error creating visit:', error)
      throw error
    }

    if (!data) {
      throw new Error('Visit was created but could not be retrieved. Please check your permissions.')
    }

    return {
      ...data,
      property: data.property ? {
        id: data.property.id,
        title: data.property.title,
        address: data.property.address,
      } : undefined,
    } as Visit
  } catch (error: any) {
    console.error('Error in createVisit:', error)
    throw error
  }
}

/**
 * Update an existing visit
 */
export async function updateVisit(id: string, updates: VisitUpdate): Promise<Visit> {
  try {
    const { data, error } = await supabase
      .from('visits')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        property:properties(id, title, address)
      `)
      .single()

    if (error) {
      console.error('Error updating visit:', error)
      throw error
    }

    if (!data) {
      throw new Error('Visit was updated but could not be retrieved. Please check your permissions.')
    }

    return {
      ...data,
      property: data.property ? {
        id: data.property.id,
        title: data.property.title,
        address: data.property.address,
      } : undefined,
    } as Visit
  } catch (error: any) {
    console.error('Error in updateVisit:', error)
    throw error
  }
}

/**
 * Delete a visit
 */
export async function deleteVisit(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting visit:', error)
      throw error
    }
  } catch (error: any) {
    console.error('Error in deleteVisit:', error)
    throw error
  }
}

/**
 * Get upcoming visits for the next 3 days (today, tomorrow, day after tomorrow)
 * Returns visits grouped by property_id
 */
export async function getUpcomingVisitsByProperty(): Promise<Record<string, Visit[]>> {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
    dayAfterTomorrow.setHours(23, 59, 59, 999) // End of day after tomorrow

    const startISO = today.toISOString()
    const endISO = dayAfterTomorrow.toISOString()

    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('status', 'scheduled')
      .gte('scheduled_at', startISO)
      .lte('scheduled_at', endISO)
      .order('scheduled_at', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Group visits by property_id
    const visitsByProperty: Record<string, Visit[]> = {}
    ;(data || []).forEach((visit: Visit) => {
      if (!visitsByProperty[visit.property_id]) {
        visitsByProperty[visit.property_id] = []
      }
      visitsByProperty[visit.property_id].push(visit)
    })

    return visitsByProperty
  } catch (error: any) {
    console.error('Error in getUpcomingVisitsByProperty:', error)
    throw error
  }
}

/**
 * Update visit status (quick status update)
 */
export async function updateVisitStatus(id: string, status: VisitStatus): Promise<Visit> {
  try {
    const { data, error } = await supabase
      .from('visits')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        property:properties(id, title, address)
      `)
      .single()

    if (error) {
      console.error('Error updating visit status:', error)
      throw error
    }

    if (!data) {
      throw new Error('Visit status update failed to return data')
    }

    return {
      ...data,
      property: data.property ? {
        id: data.property.id,
        title: data.property.title,
        address: data.property.address,
      } : undefined,
    } as Visit
  } catch (error: any) {
    console.error('Error in updateVisitStatus:', error)
    throw error
  }
}
