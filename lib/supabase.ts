// lib/supabase.ts
import 'react-native-url-polyfill/auto'; // polyfill required in React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Your environment variables are correct, as you verified
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

// Create the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,        
    persistSession: true,           
    autoRefreshToken: true,         
    detectSessionInUrl: false,     
  },
});