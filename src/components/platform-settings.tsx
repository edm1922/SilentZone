"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "@/components/platform-icons";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  FileText, 
  Image, 
  Video, 
  User, 
  Settings, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";

// Define the platform settings interface
export interface PlatformSetting {
  platformId: string;
  contentTypes: {
    posts: boolean;
    comments: boolean;
    media: boolean;
    profiles: boolean;
  };
  enabled: boolean;
}

// Default settings for each platform
export const defaultPlatformSettings: Record<string, PlatformSetting> = {
  all: {
    platformId: "all",
    contentTypes: {
      posts: true,
      comments: true,
      media: true,
      profiles: true,
    },
    enabled: true,
  },
  facebook: {
    platformId: "facebook",
    contentTypes: {
      posts: true,
      comments: true,
      media: true,
      profiles: true,
    },
    enabled: true,
  },
  youtube: {
    platformId: "youtube",
    contentTypes: {
      posts: true,
      comments: true,
      media: true,
      profiles: true,
    },
    enabled: true,
  },
  twitter: {
    platformId: "twitter",
    contentTypes: {
      posts: true,
      comments: true,
      media: true,
      profiles: true,
    },
    enabled: true,
  },
  tiktok: {
    platformId: "tiktok",
    contentTypes: {
      posts: true,
      comments: true,
      media: true,
      profiles: true,
    },
    enabled: true,
  },
  reddit: {
    platformId: "reddit",
    contentTypes: {
      posts: true,
      comments: true,
      media: true,
      profiles: true,
    },
    enabled: true,
  },
  instagram: {
    platformId: "instagram",
    contentTypes: {
      posts: true,
      comments: true,
      media: true,
      profiles: true,
    },
    enabled: true,
  },
  news: {
    platformId: "news",
    contentTypes: {
      posts: true,
      comments: true,
      media: true,
      profiles: false,
    },
    enabled: true,
  },
};

export interface PlatformSettingsProps {
  platformId: string;
  settings: PlatformSetting;
  onSettingsChange: (platformId: string, settings: PlatformSetting) => void;
  className?: string;
}

export function PlatformSettings({
  platformId,
  settings,
  onSettingsChange,
  className,
}: PlatformSettingsProps) {
  const [expanded, setExpanded] = React.useState(false);

  // Get platform name
  const getPlatformName = (id: string) => {
    switch (id) {
      case "facebook":
        return "Facebook";
      case "youtube":
        return "YouTube";
      case "twitter":
        return "Twitter/X";
      case "tiktok":
        return "TikTok";
      case "reddit":
        return "Reddit";
      case "instagram":
        return "Instagram";
      case "news":
        return "News Websites";
      case "all":
        return "All Platforms";
      default:
        return id;
    }
  };

  // Handle content type toggle
  const handleContentTypeToggle = (contentType: keyof PlatformSetting["contentTypes"]) => {
    const newSettings = {
      ...settings,
      contentTypes: {
        ...settings.contentTypes,
        [contentType]: !settings.contentTypes[contentType],
      },
    };
    onSettingsChange(platformId, newSettings);
  };

  // Handle enabled toggle
  const handleEnabledToggle = () => {
    const newSettings = {
      ...settings,
      enabled: !settings.enabled,
    };
    onSettingsChange(platformId, newSettings);
  };

  return (
    <Card className={cn("w-full", className, !settings.enabled && "opacity-60")}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PlatformIcon platformId={platformId} className="h-5 w-5" />
            <CardTitle className="text-base">{getPlatformName(platformId)}</CardTitle>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={handleEnabledToggle}
            aria-label={`Enable ${getPlatformName(platformId)}`}
          />
        </div>
        <CardDescription className="flex justify-between items-center mt-1">
          <span>Filter content on this platform</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                More
              </>
            )}
          </Button>
        </CardDescription>
      </CardHeader>
      {expanded && (
        <>
          <CardContent className="pt-0">
            <Separator className="my-2" />
            <div className="space-y-3">
              <div className="text-sm font-medium">Content Types to Filter</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={`${platformId}-posts`} className="text-sm">
                      Posts
                    </Label>
                  </div>
                  <Switch
                    id={`${platformId}-posts`}
                    checked={settings.contentTypes.posts}
                    onCheckedChange={() => handleContentTypeToggle("posts")}
                    disabled={!settings.enabled}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={`${platformId}-comments`} className="text-sm">
                      Comments
                    </Label>
                  </div>
                  <Switch
                    id={`${platformId}-comments`}
                    checked={settings.contentTypes.comments}
                    onCheckedChange={() => handleContentTypeToggle("comments")}
                    disabled={!settings.enabled}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={`${platformId}-media`} className="text-sm">
                      Media
                    </Label>
                  </div>
                  <Switch
                    id={`${platformId}-media`}
                    checked={settings.contentTypes.media}
                    onCheckedChange={() => handleContentTypeToggle("media")}
                    disabled={!settings.enabled}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={`${platformId}-profiles`} className="text-sm">
                      Profiles
                    </Label>
                  </div>
                  <Switch
                    id={`${platformId}-profiles`}
                    checked={settings.contentTypes.profiles}
                    onCheckedChange={() => handleContentTypeToggle("profiles")}
                    disabled={!settings.enabled || platformId === "news"}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

export interface PlatformSettingsListProps {
  settings: Record<string, PlatformSetting>;
  onSettingsChange: (platformId: string, settings: PlatformSetting) => void;
  className?: string;
}

export function PlatformSettingsList({
  settings,
  onSettingsChange,
  className,
}: PlatformSettingsListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Object.keys(settings).map((platformId) => (
        <PlatformSettings
          key={platformId}
          platformId={platformId}
          settings={settings[platformId]}
          onSettingsChange={onSettingsChange}
        />
      ))}
    </div>
  );
}
