"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { Clock, InfinityIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DurationIndicatorProps {
  startTime: number;
  durationMs: number;
  className?: string;
  showLabel?: boolean;
}

export function DurationIndicator({
  startTime,
  durationMs,
  className,
  showLabel = false,
}: DurationIndicatorProps) {
  // Handle permanent mutes (duration_ms === -1)
  const isPermanent = durationMs === -1;

  // Calculate end time and progress
  const endTime = !isPermanent ? startTime + durationMs : 0;
  const now = Date.now();

  // Calculate progress percentage (0-100)
  const progress = React.useMemo(() => {
    if (isPermanent) return 100;
    if (now >= endTime) return 100; // Expired

    const totalDuration = durationMs;
    const elapsed = now - startTime;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }, [startTime, durationMs, endTime, isPermanent, now]);

  // Format time remaining or status
  const timeStatus = React.useMemo(() => {
    if (isPermanent) return "Permanent";
    if (now >= endTime) return "Expired";

    try {
      return formatDistanceToNowStrict(endTime, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Unknown";
    }
  }, [endTime, isPermanent, now]);

  // Determine color based on progress
  const getColor = () => {
    if (isPermanent) return "bg-blue-500";
    if (progress >= 100) return "bg-red-500";
    if (progress > 75) return "bg-orange-500";
    if (progress > 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center space-x-2", className)}>
            {showLabel && (
              <div className="flex items-center text-xs text-muted-foreground">
                {isPermanent ? (
                  <InfinityIcon className="h-3 w-3 mr-1" />
                ) : (
                  <Clock className="h-3 w-3 mr-1" />
                )}
                <span>{timeStatus}</span>
              </div>
            )}
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", getColor())}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div>Started: {new Date(startTime).toLocaleString()}</div>
            {!isPermanent && <div>Ends: {new Date(endTime).toLocaleString()}</div>}
            <div>Status: {timeStatus}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
