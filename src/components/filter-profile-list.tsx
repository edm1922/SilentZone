"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileSwitch } from "@/components/ui/profile-switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Edit, Copy, Check, AlertCircle, Plus, Trash2, Power } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { PlatformIcon } from "@/components/platform-icons";
import { PlatformSetting } from "@/components/platform-settings";
import { useFilterProfiles } from "@/hooks/use-filter-profiles";

export interface FilterProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  platform_settings?: Record<string, PlatformSetting>; // Optional (might not be in schema)
  mute_rules?: string[]; // Optional (might not be in schema)
  created_at: string;
  updated_at: string;
  is_default?: boolean; // Indicates if this is the default profile
}

interface FilterProfileListProps {
  onEditProfile: (profileId: string) => void;
}

export function FilterProfileList({ onEditProfile }: FilterProfileListProps) {
  const { toast } = useToast();
  const {
    profiles,
    activeProfile,
    isLoading,
    error,
    createProfile,
    activateProfile,
    deleteProfile,
    createDefaultProfile
  } = useFilterProfiles();

  // Track whether we've attempted to create a default profile
  const [hasAttemptedDefaultProfile, setHasAttemptedDefaultProfile] = React.useState(false);

  // Create a default profile if none exists
  React.useEffect(() => {
    if (profiles.length === 0 && !isLoading && !error && !hasAttemptedDefaultProfile) {
      setHasAttemptedDefaultProfile(true);

      const createDefaultProfileAsync = async () => {
        try {
          await createDefaultProfile();
          toast({
            title: 'Default Profile Created',
            description: 'A default profile has been created for you.',
          });
        } catch (error) {
          console.error('Error creating default profile:', error);
          toast({
            title: 'Error',
            description: 'Failed to create default profile. Please try again.',
            variant: 'destructive',
          });
        }
      };

      createDefaultProfileAsync();
    }
  }, [profiles.length, isLoading, error, createDefaultProfile, toast, hasAttemptedDefaultProfile]);

  // Toggle profile active state
  const handleToggleActive = async (profileId: string) => {
    try {
      // Find the profile
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) return;

      // If the profile is already active, we need to find another profile to activate
      if (profile.is_active) {
        // Find a non-default profile to activate, or the default profile if no other exists
        const defaultProfile = profiles.find(p => p.is_default);
        if (defaultProfile && defaultProfile.id !== profileId) {
          await activateProfile(defaultProfile.id);
          toast({
            title: 'Profile Deactivated',
            description: 'The default profile is now active.',
          });
        } else {
          // If there's no default profile or this is the default profile,
          // find any other profile to activate
          const otherProfile = profiles.find(p => p.id !== profileId);
          if (otherProfile) {
            await activateProfile(otherProfile.id);
            toast({
              title: 'Profile Deactivated',
              description: `${otherProfile.name} is now active.`,
            });
          } else {
            // If there are no other profiles, we can't deactivate this one
            toast({
              title: 'Cannot Deactivate',
              description: 'You must have at least one active profile.',
              variant: 'destructive',
            });
          }
        }
      } else {
        // If the profile is not active, activate it
        await activateProfile(profileId);
        toast({
          title: 'Profile Activated',
          description: 'This filter profile is now active.',
        });
      }
    } catch (error) {
      console.error('Error toggling profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Delete profile
  const handleDeleteProfile = async (profileId: string) => {
    try {
      // Check if this is the active profile and if it's the only profile
      const profileToDelete = profiles.find(p => p.id === profileId);

      // Don't allow deleting default profiles
      if (profileToDelete?.is_default) {
        toast({
          title: 'Cannot Delete',
          description: 'The default profile cannot be deleted.',
          variant: 'destructive',
        });
        return;
      }

      const isLastProfile = profiles.length === 1;

      if (window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
        // If this is the last profile, we need to create a new default profile first
        if (isLastProfile) {
          try {
            // Create a new default profile first
            await createDefaultProfile();

            // Then delete the old profile
            await deleteProfile(profileId);

            toast({
              title: 'Profile Replaced',
              description: 'Your profile has been replaced with a new default profile.',
            });
          } catch (error) {
            console.error('Error replacing profile:', error);
            toast({
              title: 'Error',
              description: 'Failed to replace profile. Please try again.',
              variant: 'destructive',
            });
          }
        } else {
          // If it's not the last profile, just delete it
          await deleteProfile(profileId);

          toast({
            title: 'Profile Deleted',
            description: 'The filter profile has been deleted successfully.',
          });
        }
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Duplicate profile
  const handleDuplicateProfile = async (profileId: string) => {
    try {
      // Find the profile to duplicate
      const profileToDuplicate = profiles.find(profile => profile.id === profileId);
      if (!profileToDuplicate) return;

      // Create a new profile with the same settings
      await createProfile({
        name: `${profileToDuplicate.name} (Copy)`,
        description: profileToDuplicate.description,
        is_active: false,
        platform_settings: profileToDuplicate.platform_settings,
        mute_rules: profileToDuplicate.mute_rules,
      });

      toast({
        title: 'Profile Duplicated',
        description: 'The filter profile has been duplicated successfully.',
      });
    } catch (error) {
      console.error('Error duplicating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Filter Profiles</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            You haven't created any filter profiles yet. Click the "New Profile" button to create a profile and manage different filtering preferences for various contexts.
          </p>
          <Button
            onClick={() => onEditProfile("new")}
            className="mt-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {profiles.map((profile) => (
        <Card key={profile.id} className={profile.is_active ? "border-primary" : ""}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center">
                  {profile.name}
                  {/* Show Main badge only for the default profile */}
                  {profile.is_default ? (
                    <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-800 border-green-300">
                      <Check className="h-3 w-3 mr-1" />
                      Main
                    </Badge>
                  ) : profile.is_active && (
                    <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{profile.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {profile.is_default ? (
                  <span className="text-sm text-green-600 font-medium flex items-center">
                    <Power className="h-4 w-4 mr-1" />
                    Default
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <ProfileSwitch
                      checked={profile.is_active}
                      onCheckedChange={() => handleToggleActive(profile.id)}
                      aria-label={profile.is_active ? "Deactivate profile" : "Activate profile"}
                    />
                    <span className={`text-sm font-medium ${profile.is_active ? "text-green-600" : "text-gray-500"}`}>
                      {profile.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">Platforms:</span>{" "}
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.platform_settings && Object.keys(profile.platform_settings).length > 0 ? (
                    Object.keys(profile.platform_settings).map((platformId) => (
                      <Badge key={platformId} variant="secondary" className="flex items-center gap-1">
                        <PlatformIcon platformId={platformId} className="h-3 w-3" />
                        <span className="text-xs">{platformId === "all" ? "All" : platformId}</span>
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <PlatformIcon platformId="all" className="h-3 w-3" />
                      <span className="text-xs">All Platforms</span>
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-sm">
                <span className="font-medium">Mute Rules:</span>{" "}
                <span className="text-muted-foreground">
                  {!profile.mute_rules || profile.mute_rules.length === 0
                    ? "All rules applied"
                    : `${profile.mute_rules.length} specific rule${profile.mute_rules.length !== 1 ? 's' : ''} applied`}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditProfile(profile.id)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDuplicateProfile(profile.id)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
            </div>
            {profile.is_default ? (
              <button
                className="px-3 py-1 text-sm bg-gray-300 text-gray-600 rounded-md cursor-not-allowed"
                disabled
                title="Default profile cannot be deleted"
              >
                <Trash2 className="h-4 w-4 mr-1 inline" />
                Delete
              </button>
            ) : (
              <button
                className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                onClick={() => handleDeleteProfile(profile.id)}
              >
                <Trash2 className="h-4 w-4 mr-1 inline" />
                Delete
              </button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
