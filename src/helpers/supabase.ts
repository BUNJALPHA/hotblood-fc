import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dggncqnfdzohvqamelzs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZ25jcW5mZHpvaHZxYW1lbHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDQxMTAsImV4cCI6MjA4NTc4MDExMH0.om174jsOoDO9teA3BO1o1IQ9auwZwQSNMbPFC21DJ_8'

export const supabase = createClient(supabaseUrl, supabaseKey)