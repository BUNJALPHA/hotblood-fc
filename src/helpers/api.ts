// =============================================
// HOT BLOOD FC — API Helpers
// Shared data access layer for all components
// =============================================

import { supabase } from './supabase'

// --- Generic fetch with error handling ---
export async function fetchAll<T>(
  table: string,
  options: {
    select?: string
    filter?: Record<string, unknown>
    eq?: Record<string, unknown>
    order?: { column: string; ascending?: boolean }
    limit?: number
  } = {}
): Promise<T[]> {
  let query = supabase.from(table).select(options.select || '*')

  if (options.eq) {
    for (const [key, value] of Object.entries(options.eq)) {
      query = query.eq(key, value)
    }
  }

  if (options.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending ?? false })
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) {
    console.error(`Error fetching ${table}:`, error.message)
    return []
  }
  return (data as T[]) || []
}

// --- Generic insert ---
export async function insertRow<T>(
  table: string,
  row: Record<string, unknown>
): Promise<T | null> {
  const { data, error } = await supabase.from(table).insert(row).select().single()
  if (error) {
    console.error(`Error inserting into ${table}:`, error.message)
    return null
  }
  return data as T
}

// --- Generic update ---
export async function updateRow<T>(
  table: string,
  id: string,
  updates: Record<string, unknown>
): Promise<T | null> {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()
  if (error) {
    console.error(`Error updating ${table}:`, error.message)
    return null
  }
  return data as T
}

// --- Generic delete ---
export async function deleteRow(table: string, id: string): Promise<boolean> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) {
    console.error(`Error deleting from ${table}:`, error.message)
    return false
  }
  return true
}

// --- File upload to Supabase Storage ---
export async function uploadFile(
  bucket: string,
  file: File,
  folder?: string
): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${folder ? folder + '/' : ''}${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 11)}.${fileExt}`

  const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file)

  if (uploadError) {
    console.error(`Error uploading to ${bucket}:`, uploadError.message)
    return null
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data.publicUrl
}

// --- Get current user profile ---
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}

// --- Generate unique code ---
export function generateCode(prefix = '', length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = prefix
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// --- Format currency (KES) ---
export function formatKES(amount: number | null | undefined): string {
  return `KES ${(Number(amount) || 0).toLocaleString()}`
}

// --- Format date ---
export function formatDate(date: string | null | undefined): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// --- Format time ---
export function formatTime(date: string | null | undefined): string {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// --- Debounce helper (for search inputs) ---
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// --- Realtime subscription helper ---
export function subscribe(
  table: string,
  callback: () => void,
  filter?: string
) {
  let channel = supabase.channel(`${table}_changes`)
  channel = channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table,
      ...(filter ? { filter } : {}),
    },
    () => callback()
  )
  channel.subscribe()
  return () => channel.unsubscribe()
}
