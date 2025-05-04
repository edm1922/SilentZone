"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Clock, Globe, CloudOff } from "lucide-react";
import { formatDistanceToNowStrict, addMilliseconds } from 'date-fns';
import { Platform } from "@/components/platform-selector";

interface SupabaseMutedContentCardProps {
  id: string;
  keywords: string[];
  platforms: Platform[];
  start_time: number; // Timestamp when muting started
  duration_ms: number; // Duration in milliseconds
  use_regex?: boolean;
  case_sensitive?: boolean;
  match_whole_word?: boolean;
  onRemove: (id: string) => void;
  onEdit?: (id: string) => void; // Optional edit functionality
}

export function SupabaseMutedContentCard({
  id,
  keywords,
  platforms,
  start_time,
  duration_ms,
  use_regex = false,
  case_sensitive = false,
  match_whole_word = false,
  onRemove,
  onEdit,
}: SupabaseMutedContentCardProps) {
    // Add validation and debugging
    React.useEffect(() => {
      console.log("SupabaseMutedContentCard rendering with props:", {
        id,
        keywords: Array.isArray(keywords) ? keywords : "NOT_ARRAY",
        keywordsLength: Array.isArray(keywords) ? keywords.length : "N/A",
        platforms: Array.isArray(platforms) ? platforms.length : "NOT_ARRAY",
        start_time,
        duration_ms,
        use_regex,
        case_sensitive,
        match_whole_word
      });

      // Validate props
      if (!Array.isArray(keywords)) {
        console.error("Keywords is not an array:", keywords);
      }

      if (!Array.isArray(platforms)) {
        console.error("Platforms is not an array:", platforms);
      }

      if (typeof start_time !== 'number') {
        console.error("start_time is not a number:", start_time);
      }

      if (typeof duration_ms !== 'number') {
        console.error("duration_ms is not a number:", duration_ms);
      }
    }, [id, keywords, platforms, start_time, duration_ms, use_regex, case_sensitive, match_whole_word]);

    const [timeLeft, setTimeLeft] = React.useState<string>("");
    const endTime = typeof start_time === 'number' && typeof duration_ms === 'number'
      ? start_time + duration_ms
      : Date.now(); // Fallback to now if invalid data

    React.useEffect(() => {
        const calculateTimeLeft = () => {
            try {
                const now = Date.now();
                if (now >= endTime) {
                    setTimeLeft("Expired");
                } else {
                    // Calculate remaining time
                    const endDateTime = addMilliseconds(new Date(start_time), duration_ms);
                    setTimeLeft(formatDistanceToNowStrict(endDateTime, { addSuffix: true }));
                }
            } catch (error) {
                console.error("Error calculating time left:", error);
                setTimeLeft("Unknown");
            }
        };

        calculateTimeLeft();
        const intervalId = setInterval(calculateTimeLeft, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, [start_time, duration_ms, endTime]);


  // Check if this is a local rule (stored locally only)
  const isLocalRule = id.startsWith('local_');

  return (
    <Card className={`w-full shadow-md hover:shadow-lg transition-shadow duration-200 border ${isLocalRule ? 'border-yellow-300' : 'border-border'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>Muted Content</span>
            {isLocalRule && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs border-yellow-300 text-yellow-700 bg-yellow-50">
                <CloudOff className="h-3 w-3" />
                Local
              </Badge>
            )}
          </div>
          <Badge variant={timeLeft === "Expired" ? "destructive" : "outline"} className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {timeLeft}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 space-y-3">
        <div className="flex flex-wrap gap-2">
          {Array.isArray(keywords) && keywords.length > 0 ? (
            keywords.map((keyword, index) => (
              <Badge key={`${keyword}-${index}`} variant="secondary" className="bg-accent text-accent-foreground">
                {keyword}
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              No keywords
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          <span>
            {Array.isArray(platforms) && platforms.length > 0 ? (
              platforms[0]?.id === "all"
                ? "All Platforms"
                : platforms.map(p => p?.name || "Unknown").join(", ")
            ) : (
              "Unknown Platforms"
            )}
          </span>
        </div>

        {/* Advanced options badges */}
        {(use_regex || case_sensitive || match_whole_word) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {use_regex && (
              <span className="px-1.5 py-0.5 bg-muted text-xs rounded text-muted-foreground">
                Regex
              </span>
            )}
            {case_sensitive && (
              <span className="px-1.5 py-0.5 bg-muted text-xs rounded text-muted-foreground">
                Case Sensitive
              </span>
            )}
            {match_whole_word && (
              <span className="px-1.5 py-0.5 bg-muted text-xs rounded text-muted-foreground">
                Whole Word
              </span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4 flex justify-end gap-2">
        {onEdit && (
          <Button variant="ghost" size="icon" onClick={() => onEdit(id)} className="text-muted-foreground hover:text-foreground">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit Mute</span>
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => onRemove(id)} className="text-destructive/80 hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove Mute</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
