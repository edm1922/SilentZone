"use client";

import * as React from "react";
import { useSupabaseAuth } from "@/contexts/supabase-auth-context";
import { supabase } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { PlatformSettingsList, PlatformSetting, defaultPlatformSettings } from "@/components/platform-settings";
import { useSupabaseMuteRules } from "@/hooks/use-supabase-mute-rules";
import { FilterProfile } from "@/components/filter-profile-list";
import { useFilterProfiles } from "@/hooks/use-filter-profiles";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileFormSchema = z.object({
  name: z.string().min(1, "Profile name is required").max(50, "Profile name must be less than 50 characters"),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
  is_active: z.boolean().default(false),
  include_all_rules: z.boolean().default(true),
  selected_rules: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface FilterProfileFormProps {
  profileId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function FilterProfileForm({ profileId, onCancel, onSuccess }: FilterProfileFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState<boolean>(!!profileId);
  const [platformSettings, setPlatformSettings] = React.useState<Record<string, PlatformSetting>>(() => {
    // Initialize with default settings
    const settings: Record<string, PlatformSetting> = {};
    Object.keys(defaultPlatformSettings).forEach(platformId => {
      settings[platformId] = { ...defaultPlatformSettings[platformId] };
    });
    return settings;
  });

  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const { muteRules } = useSupabaseMuteRules();
  const { createProfile, updateProfile } = useFilterProfiles();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: false, // Default to inactive for new profiles
      include_all_rules: true,
      selected_rules: [],
    },
  });

  // Load profile data if editing
  React.useEffect(() => {
    if (!profileId || !user) return;

    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('filter_profiles')
          .select('*')
          .eq('id', profileId)
          .eq('user_id', user?.id)
          .single();

        if (error) {
          console.error('Supabase error fetching profile:', error);
          throw new Error(error.message);
        }

        if (!data) {
          throw new Error('Profile not found');
        }

        form.reset({
          name: data.name,
          description: data.description || "",
          is_active: data.is_active,
          include_all_rules: !data.mute_rules || data.mute_rules.length === 0,
          selected_rules: data.mute_rules || [],
        });

        // Now that we have the column in the database, use the platform settings from the profile
        if (data.platform_settings) {
          setPlatformSettings(data.platform_settings);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: `Failed to load profile data: ${error instanceof Error ? error.message : String(error)}`,
          variant: 'destructive',
        });
        onCancel();
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [profileId, user, form, toast, onCancel]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create or update profiles.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Now that we have the columns in the database, include all fields
      const profileData = {
        name: values.name,
        description: values.description,
        is_active: values.is_active,
        platform_settings: platformSettings,
        mute_rules: values.include_all_rules ? [] : values.selected_rules,
      };

      if (profileId) {
        // Update existing profile
        await updateProfile(profileId, profileData);
      } else {
        // Create new profile
        await createProfile(profileData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: `Failed to ${profileId ? 'update' : 'create'} profile: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Name</FormLabel>
                <FormControl>
                  <Input placeholder="Work, Entertainment, News, etc." {...field} />
                </FormControl>
                <FormDescription>
                  Give your filter profile a descriptive name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what this profile is for..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Make this profile active
                  </FormLabel>
                  <FormDescription>
                    This will deactivate all other profiles
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Platform Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure which platforms and content types this profile will filter
          </p>

          <PlatformSettingsList
            settings={platformSettings}
            onSettingsChange={(platformId, settings) => {
              setPlatformSettings(prev => ({
                ...prev,
                [platformId]: settings
              }));
            }}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Mute Rules</h3>
          <p className="text-sm text-muted-foreground">
            Choose which mute rules to include in this profile
          </p>

          <FormField
            control={form.control}
            name="include_all_rules"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Include all mute rules
                  </FormLabel>
                  <FormDescription>
                    Apply all current and future mute rules to this profile
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {!form.watch("include_all_rules") && (
            <div className="space-y-2 mt-4">
              <Label>Select specific rules to include:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {muteRules.map((rule) => (
                  <FormField
                    key={rule.id}
                    control={form.control}
                    name="selected_rules"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(rule.id)}
                            onCheckedChange={(checked) => {
                              const currentValue = field.value || [];
                              const newValue = checked
                                ? [...currentValue, rule.id]
                                : currentValue.filter((id) => id !== rule.id);
                              field.onChange(newValue);
                            }}
                          />
                        </FormControl>
                        <div className="leading-none">
                          <FormLabel className="text-sm">
                            {rule.keywords?.join(", ") || "Unnamed rule"}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {profileId ? "Updating..." : "Creating..."}
              </>
            ) : (
              profileId ? "Update Profile" : "Create Profile"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
