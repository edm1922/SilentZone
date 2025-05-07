"use client";

import * as React from "react";
import { Check, Globe, Settings, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/platform-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  PlatformSettingsList,
  PlatformSetting,
  defaultPlatformSettings
} from "@/components/platform-settings";
import { Input } from "@/components/ui/input";

export interface Platform {
  id: string;
  name: string;
  settings?: PlatformSetting;
}

export const availablePlatforms: Platform[] = [
  { id: "all", name: "All Platforms" },
  { id: "facebook", name: "Facebook" },
  { id: "youtube", name: "YouTube" },
  { id: "twitter", name: "Twitter/X" },
  { id: "tiktok", name: "TikTok" },
  { id: "reddit", name: "Reddit" },
  { id: "news", name: "News Websites" },
  { id: "instagram", name: "Instagram" },
];

interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onPlatformsChange: (platforms: Platform[]) => void;
  platformSettings?: Record<string, PlatformSetting>;
  onPlatformSettingsChange?: (settings: Record<string, PlatformSetting>) => void;
  className?: string;
}

export function PlatformSelector({
  selectedPlatforms,
  onPlatformsChange,
  platformSettings = {},
  onPlatformSettingsChange,
  className,
}: PlatformSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Initialize platform settings if not provided
  const [localPlatformSettings, setLocalPlatformSettings] = React.useState<Record<string, PlatformSetting>>(() => {
    // Start with default settings
    const settings: Record<string, PlatformSetting> = {};

    // For each available platform, use provided settings or defaults
    availablePlatforms.forEach(platform => {
      settings[platform.id] = platformSettings[platform.id] || defaultPlatformSettings[platform.id] || {
        ...defaultPlatformSettings.all,
        platformId: platform.id
      };
    });

    return settings;
  });

  // Update local settings when prop changes
  React.useEffect(() => {
    if (Object.keys(platformSettings).length > 0) {
      setLocalPlatformSettings(platformSettings);
    }
  }, [platformSettings]);

  const handleSelectPlatform = (platform: Platform) => {
    // If "All Platforms" is selected, clear other selections
    if (platform.id === "all") {
      onPlatformsChange([{
        ...platform,
        settings: localPlatformSettings[platform.id]
      }]);
      setSearchQuery(""); // Clear search query
      return;
    }

    // If a specific platform is selected, remove "All Platforms" if present
    let newSelection = [...selectedPlatforms];
    newSelection = newSelection.filter((p) => p.id !== "all");

    // Toggle the selected platform
    const isAlreadySelected = newSelection.some((p) => p.id === platform.id);
    if (isAlreadySelected) {
      newSelection = newSelection.filter((p) => p.id !== platform.id);
    } else {
      newSelection.push({
        ...platform,
        settings: localPlatformSettings[platform.id]
      });
    }

    // If no platforms are selected, default to "All Platforms"
    if (newSelection.length === 0) {
      newSelection = [{
        ...availablePlatforms[0],
        settings: localPlatformSettings.all
      }];
    }

    onPlatformsChange(newSelection);
    // Don't close the dropdown to allow multiple selections
  };

  const handleRemovePlatform = (platformId: string) => {
    const newSelection = selectedPlatforms.filter((p) => p.id !== platformId);

    // If no platforms are selected, default to "All Platforms"
    if (newSelection.length === 0) {
      onPlatformsChange([{
        ...availablePlatforms[0],
        settings: localPlatformSettings.all
      }]);
    } else {
      onPlatformsChange(newSelection);
    }
  };

  // Handle platform settings change
  const handlePlatformSettingChange = (platformId: string, settings: PlatformSetting) => {
    const newSettings = {
      ...localPlatformSettings,
      [platformId]: settings
    };

    setLocalPlatformSettings(newSettings);

    // Update selected platforms with new settings
    const updatedPlatforms = selectedPlatforms.map(platform => {
      if (platform.id === platformId) {
        return {
          ...platform,
          settings: settings
        };
      }
      return platform;
    });

    // Notify parent component
    if (onPlatformSettingsChange) {
      onPlatformSettingsChange(newSettings);
    }

    // Update selected platforms
    onPlatformsChange(updatedPlatforms);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Popover
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setSearchQuery("");
            }
          }}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
            >
              {selectedPlatforms.length === 1 && selectedPlatforms[0].id === "all"
                ? "All Platforms"
                : `${selectedPlatforms.length} Platform${
                    selectedPlatforms.length !== 1 ? "s" : ""
                  } Selected`}
              <Globe className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Search platforms..."
                className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <div className="p-2">
                {availablePlatforms
                  .filter(platform =>
                    platform.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((platform) => (
                    <div
                      key={platform.id}
                      className={cn(
                        "flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                        selectedPlatforms.some((p) => p.id === platform.id) && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => {
                        handleSelectPlatform(platform);
                        // Keep dropdown open for multiple selections
                      }}
                    >
                      <div className="flex items-center">
                        <PlatformIcon platformId={platform.id} className="mr-2 h-4 w-4" />
                        <span>{platform.name}</span>
                      </div>
                      {selectedPlatforms.some((p) => p.id === platform.id) && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  ))}
                {availablePlatforms.filter(platform =>
                  platform.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="py-6 text-center text-sm">No platform found.</div>
                )}
              </div>
              <div className="p-2 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="sm"
                    onClick={() => {
                      onPlatformsChange([{
                        ...availablePlatforms[0],
                        settings: localPlatformSettings.all
                      }]);
                      setSearchQuery("");
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Platform Settings</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Platform Settings</DialogTitle>
              <DialogDescription>
                Configure how filtering works on each platform. These settings apply to all mute rules.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <PlatformSettingsList
                settings={localPlatformSettings}
                onSettingsChange={handlePlatformSettingChange}
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setSettingsDialogOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Display selected platforms as badges */}
      {selectedPlatforms.length > 0 && selectedPlatforms[0].id !== "all" && (
        <div className="flex flex-wrap gap-2">
          {selectedPlatforms.map((platform) => (
            <Badge
              key={platform.id}
              variant="secondary"
              className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              <PlatformIcon platformId={platform.id} className="h-3 w-3 mr-1" />
              {platform.name}
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                onClick={() => handleRemovePlatform(platform.id)}
              >
                <Check className="h-3 w-3" />
                <span className="sr-only">Remove {platform.name}</span>
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
