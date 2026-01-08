import { Property } from './property'

export type VisitStatus = 'scheduled' | 'completed' | 'cancelled'

export interface Visit {
  id: string
  property_id: string
  scheduled_at: string // ISO timestamp (UTC)
  notes: string | null
  status: VisitStatus
  created_at: string
  updated_at: string
  // Joined data (when fetched with property)
  property?: {
    id: string
    title: string
    address: string
  }
}

export interface VisitInsert {
  property_id: string
  scheduled_at: string // ISO timestamp
  notes?: string | null
  status?: VisitStatus
}

export interface VisitUpdate {
  scheduled_at?: string
  notes?: string | null
  status?: VisitStatus
}
