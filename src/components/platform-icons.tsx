"use client";

import * as React from "react";
import { 
  Globe, 
  Facebook, 
  Youtube, 
  Twitter, 
  MessageCircle, 
  Instagram, 
  Newspaper, 
  Video
} from "lucide-react";

export interface PlatformIconProps {
  platformId: string;
  className?: string;
}

export function PlatformIcon({ platformId, className }: PlatformIconProps) {
  switch (platformId) {
    case "facebook":
      return <Facebook className={className} />;
    case "youtube":
      return <Youtube className={className} />;
    case "twitter":
      return <Twitter className={className} />;
    case "tiktok":
      return <Video className={className} />;
    case "reddit":
      return <MessageCircle className={className} />;
    case "instagram":
      return <Instagram className={className} />;
    case "news":
      return <Newspaper className={className} />;
    case "all":
      return <Globe className={className} />;
    default:
      return <Globe className={className} />;
  }
}
