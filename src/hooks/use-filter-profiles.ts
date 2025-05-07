"use client";

import { useSupabaseAuth } from "@/contexts/supabase-auth-context";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { FilterProfile } from "@/components/filter-profile-list";
import { PlatformSetting, defaultPlatformSettings } from "@/components/platform-settings";

export function useFilterProfiles() {
  const [profiles, setProfiles] = useState<FilterProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<FilterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { user } = useSupabaseAuth();

  // Fetch profiles
  useEffect(() => {
    if (!user) {
      setProfiles([]);
      setActiveProfile(null);
      setIsLoading(false);
      return;
    }

    const fetchProfiles = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('filter_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false }) // Default profiles first
          .order('created_at', { ascending: false }); // Then newest first

        if (error) {
          console.error("Supabase error fetching profiles:", error);
          throw new Error(error.message);
        }

        // Sort profiles to put default profile at the top
        const sortedProfiles = [...(data || [])].sort((a, b) => {
          // Default profile comes first
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          // Then sort by creation date (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setProfiles(sortedProfiles);

        // Find active profile
        const active = data?.find(profile => profile.is_active);
        setActiveProfile(active || null);

        // If no active profile and we have profiles, activate the first one
        if (!active && data && data.length > 0) {
          try {
            await activateProfile(data[0].id);
          } catch (activateErr) {
            console.error("Error activating profile:", activateErr);
            // Continue even if activation fails
          }
        }

        // Don't automatically create default profiles
        // Let the user create profiles manually
      } catch (err) {
        console.error("Error fetching filter profiles:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [user]);

  // Create a profile
  const createProfile = async (profile: Omit<FilterProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error("User must be logged in to create profiles");
    }

    try {
      // Now that we have the columns in the database, include all fields
      const profileData = {
        user_id: user.id,
        ...profile
      };

      // If this profile is active, deactivate all others first
      if (profile.is_active) {
        const { error: updateError } = await supabase
          .from('filter_profiles')
          .update({ is_active: false })
          .eq('user_id', user.id);

        if (updateError) {
          console.error("Error deactivating other profiles:", updateError);
          // Continue anyway
        }
      }

      // If this profile is being set as default, make sure no other profile is default
      if (profile.is_default) {
        const { error: updateDefaultError } = await supabase
          .from('filter_profiles')
          .update({ is_default: false })
          .eq('user_id', user.id);

        if (updateDefaultError) {
          console.error("Error updating default status of other profiles:", updateDefaultError);
          // Continue anyway
        }
      }

      const { data, error } = await supabase
        .from('filter_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error("Supabase error creating profile:", error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("No data returned after creating profile");
      }

      // Update local state and maintain sorting (default profile at top)
      setProfiles(prev => {
        const newProfiles = [...prev, data];
        return newProfiles.sort((a, b) => {
          // Default profile comes first
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          // Then sort by creation date (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });

      if (data.is_active) {
        setActiveProfile(data);
      }

      return data;
    } catch (err) {
      console.error("Error creating filter profile:", err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  // Create default profile
  const createDefaultProfile = async () => {
    try {
      if (!user) {
        throw new Error("User must be logged in to create default profile");
      }

      // Create platform settings with defaults
      const platformSettings: Record<string, PlatformSetting> = {};
      Object.keys(defaultPlatformSettings).forEach(platformId => {
        platformSettings[platformId] = { ...defaultPlatformSettings[platformId] };
      });

      // Get user's name from user object or use a fallback
      let userName = "User";
      try {
        // Try to get user's name from metadata or email
        if (user.user_metadata && user.user_metadata.full_name) {
          userName = user.user_metadata.full_name;
        } else if (user.user_metadata && user.user_metadata.name) {
          userName = user.user_metadata.name;
        } else if (user.email) {
          // Extract name from email (before the @)
          const emailName = user.email.split('@')[0];
          // Capitalize first letter and replace dots/underscores with spaces
          userName = emailName
            .replace(/[._]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        }
      } catch (e) {
        console.error("Error getting user name:", e);
      }

      // Create directly with Supabase instead of using createProfile to avoid circular dependencies
      // Now that we have the columns in the database, include all fields
      const profileData = {
        user_id: user.id,
        name: userName,
        description: "Default filtering profile with standard settings",
        is_active: true,
        is_default: true, // Mark this profile as the default one
        platform_settings: platformSettings,
        mute_rules: [] // Empty array means include all rules
      };

      const { data, error } = await supabase
        .from('filter_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error("Supabase error creating default profile:", error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("No data returned after creating default profile");
      }

      // Update local state and ensure default profile is at the top
      setProfiles(prev => {
        const newProfiles = [...prev, data];
        // Sort to put default profile at the top
        return newProfiles.sort((a, b) => {
          if (a.is_default) return -1;
          if (b.is_default) return 1;
          // Then sort by creation date (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });
      setActiveProfile(data);

      return data;
    } catch (err) {
      console.error("Error creating default profile:", err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  // Update a profile
  const updateProfile = async (id: string, updates: Partial<Omit<FilterProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) {
      throw new Error("User must be logged in to update profiles");
    }

    try {
      // If this profile is being activated, deactivate all others first
      if (updates.is_active) {
        const { error: updateError } = await supabase
          .from('filter_profiles')
          .update({ is_active: false })
          .neq('id', id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error("Error deactivating other profiles:", updateError);
          // Continue anyway
        }
      }

      // If this profile is being set as default, make sure no other profile is default
      if (updates.is_default) {
        const { error: updateDefaultError } = await supabase
          .from('filter_profiles')
          .update({ is_default: false })
          .neq('id', id)
          .eq('user_id', user.id);

        if (updateDefaultError) {
          console.error("Error updating default status of other profiles:", updateDefaultError);
          // Continue anyway
        }
      }

      // Now that we have the columns in the database, include all fields
      const { data, error } = await supabase
        .from('filter_profiles')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error updating profile:", error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("No data returned after updating profile");
      }

      // Update local state
      setProfiles(prev =>
        prev.map(profile =>
          profile.id === id
            ? { ...profile, ...updates }
            : updates.is_active ? { ...profile, is_active: false } : profile
        )
      );

      if (updates.is_active) {
        setActiveProfile(data);
      } else if (activeProfile?.id === id && updates.is_active === false) {
        setActiveProfile(null);
      }

      return data;
    } catch (err) {
      console.error("Error updating filter profile:", err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  // Activate a profile
  const activateProfile = async (id: string) => {
    try {
      return await updateProfile(id, { is_active: true });
    } catch (err) {
      console.error("Error activating profile:", err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  // Delete a profile
  const deleteProfile = async (id: string) => {
    if (!user) {
      throw new Error("User must be logged in to delete profiles");
    }

    try {
      // We now allow deleting active profiles, but not default profiles
      const profileToDelete = profiles.find(p => p.id === id);

      if (profileToDelete?.is_default) {
        throw new Error("Cannot delete the default profile.");
      }

      const { error } = await supabase
        .from('filter_profiles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error("Supabase error deleting profile:", error);
        throw new Error(error.message);
      }

      // Update local state
      setProfiles(prev => prev.filter(profile => profile.id !== id));
    } catch (err) {
      console.error("Error deleting filter profile:", err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  return {
    profiles,
    activeProfile,
    isLoading,
    error,
    createProfile,
    updateProfile,
    activateProfile,
    deleteProfile,
    createDefaultProfile,
  };
}
