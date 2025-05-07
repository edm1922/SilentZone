"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";
import { Clock, InfinityIcon } from "lucide-react";

interface DurationBadgeProps {
  startTime: number;
  durationMs: number;
  className?: string;
  showIcon?: boolean;
}

export function DurationBadge({
  startTime,
  durationMs,
  className,
  showIcon = true,
}: DurationBadgeProps) {
  // Handle permanent mutes (duration_ms === -1)
  const isPermanent = durationMs === -1;

  // Calculate end time
  const endTime = !isPermanent ? startTime + durationMs : 0;
  const now = Date.now();
  const isExpired = !isPermanent && now >= endTime;
  const isActive = isPermanent || now < endTime;

  // Determine variant based on status
  const getVariant = () => {
    if (isPermanent) return "secondary";
    if (isExpired) return "destructive";
    
    // Calculate remaining time percentage
    const totalDuration = durationMs;
    const elapsed = now - startTime;
    const percentComplete = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    if (percentComplete > 75) return "destructive";
    if (percentComplete > 50) return "warning";
    return "outline";
  };

  // Format time remaining or status
  const getTimeText = () => {
    if (isPermanent) return "Permanent";
    if (isExpired) return "Expired";
    
    try {
      return formatDistanceToNow(endTime, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Unknown";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={getVariant() as any} 
            className={cn("cursor-help", className)}
          >
            {showIcon && (
              isPermanent ? 
                <InfinityIcon className="h-3 w-3 mr-1" /> : 
                <Clock className="h-3 w-3 mr-1" />
            )}
            {getTimeText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div>Started: {new Date(startTime).toLocaleString()}</div>
            {!isPermanent && <div>Ends: {new Date(endTime).toLocaleString()}</div>}
            <div>Status: {isActive ? "Active" : "Expired"}</div>
            {!isPermanent && !isExpired && (
              <div className="h-1 w-full bg-muted rounded-full mt-2">
                <div 
                  className={cn(
                    "h-full rounded-full",
                    getVariant() === "destructive" ? "bg-destructive" : 
                    getVariant() === "warning" ? "bg-yellow-500" : 
                    "bg-primary"
                  )}
                  style={{ 
                    width: `${Math.min(100, Math.max(0, ((now - startTime) / durationMs) * 100))}%` 
                  }}
                />
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
