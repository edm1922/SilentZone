'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AddDefaultColumnPage() {
  const [status, setStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const supabase = createClientComponentClient();

  const addColumn = async () => {
    try {
      setIsUpdating(true);
      setStatus('Adding is_default column to filter_profiles table...');

      // Use Supabase's RPC to execute raw SQL
      const { error } = await supabase.rpc('add_is_default_column');

      if (error) {
        throw error;
      }

      setStatus('Column added successfully. Now updating existing profiles...');

      // Get all profiles that start with "Main -"
      const { data: profiles, error: fetchError } = await supabase
        .from('filter_profiles')
        .select('*')
        .like('name', 'Main -%');

      if (fetchError) {
        throw fetchError;
      }

      setStatus(`Found ${profiles?.length || 0} profiles to update`);

      // Update each profile
      if (profiles && profiles.length > 0) {
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
      } else {
        // If no "Main -" profiles found, set the first profile as default
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('filter_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (allProfilesError) {
          throw allProfilesError;
        }

        if (allProfiles && allProfiles.length > 0) {
          const { error: updateError } = await supabase
            .from('filter_profiles')
            .update({ is_default: true })
            .eq('id', allProfiles[0].id);

          if (updateError) {
            setStatus(prev => `${prev}\nError setting default profile: ${updateError.message}`);
          } else {
            setStatus(prev => `${prev}\nSet profile ${allProfiles[0].id} as default`);
          }
        }
      }

      setStatus(prev => `${prev}\nMigration complete`);
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Add is_default Column</h1>
      <p className="mb-4">
        This page will add the is_default column to the filter_profiles table and update existing profiles.
      </p>
      <Button 
        onClick={addColumn} 
        disabled={isUpdating}
        className="mb-4"
      >
        {isUpdating ? 'Adding Column...' : 'Add Column'}
      </Button>
      {status && (
        <pre className="p-4 bg-gray-100 rounded-md whitespace-pre-wrap">
          {status}
        </pre>
      )}
    </div>
  );
}
