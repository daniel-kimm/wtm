import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('Supabase URL:', supabaseUrl); // For debugging
console.log('Supabase Anon Key exists:', !!supabaseAnonKey); // For debugging

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if email is a Northwestern email
export const isNorthwesternEmail = (email: string) => {
  if (!email) {
    console.log('No email provided to isNorthwesternEmail');
    return false;
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  console.log('Checking email:', normalizedEmail);
  
  const validDomains = ['@northwestern.edu', '@u.northwestern.edu'];
  const isNorthwestern = validDomains.some(domain => normalizedEmail.endsWith(domain));
  console.log('Is Northwestern email:', isNorthwestern);
  
  return isNorthwestern;
}; 