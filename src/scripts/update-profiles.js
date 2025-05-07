// This script updates existing profiles to remove "Main -" from their names
// and sets the is_default flag for profiles that start with "Main -"

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateProfiles() {
  try {
    // Get all profiles that start with "Main -"
    const { data: profiles, error } = await supabase
      .from('filter_profiles')
      .select('*')
      .like('name', 'Main -%');

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    console.log(`Found ${profiles.length} profiles to update`);

    // Update each profile
    for (const profile of profiles) {
      // Remove "Main -" from the name
      const newName = profile.name.replace('Main - ', '');
      
      // Update the profile
      const { error: updateError } = await supabase
        .from('filter_profiles')
        .update({ 
          name: newName,
          is_default: true 
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`Error updating profile ${profile.id}:`, updateError);
      } else {
        console.log(`Updated profile ${profile.id}: ${profile.name} -> ${newName}`);
      }
    }

    console.log('Profile update complete');
  } catch (error) {
    console.error('Error updating profiles:', error);
  }
}

// Run the update
updateProfiles();
