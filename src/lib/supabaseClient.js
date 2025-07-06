// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project credentials
const supabaseUrl = 'https://lxnaqthypjfewxyomboa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bmFxdGh5cGpmZXd4eW9tYm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDQ2NTEsImV4cCI6MjA2NzIyMDY1MX0.cQdsD6RCAelUwXH8cuD2DZWxzsJ4HRVro2paqEqkAnI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)