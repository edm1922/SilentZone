'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function UpdateProfilesPage() {
  const [status, setStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const supabase = createClientComponentClient();

  const updateProfiles = async () => {
    try {
      setIsUpdating(true);
      setStatus('Updating profiles...');

      // Get all profiles that start with "Main -"
      const { data: profiles, error } = await supabase
        .from('filter_profiles')
        .select('*')
        .like('name', 'Main -%');

      if (error) {
        throw error;
      }

      setStatus(`Found ${profiles.length} profiles to update`);

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
          setStatus(prev => `${prev}\nError updating profile ${profile.id}: ${updateError.message}`);
        } else {
          setStatus(prev => `${prev}\nUpdated profile ${profile.id}: ${profile.name} -> ${newName}`);
        }
      }

      setStatus(prev => `${prev}\nProfile update complete`);
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Update Profiles</h1>
      <p className="mb-4">
        This page will update all profiles that start with "Main -" to remove the prefix and set the is_default flag.
      </p>
      <Button 
        onClick={updateProfiles} 
        disabled={isUpdating}
        className="mb-4"
      >
        {isUpdating ? 'Updating...' : 'Update Profiles'}
      </Button>
      {status && (
        <pre className="p-4 bg-gray-100 rounded-md whitespace-pre-wrap">
          {status}
        </pre>
      )}
    </div>
  );
}
