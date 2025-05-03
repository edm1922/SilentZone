
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Clock } from "lucide-react";
import { formatDistanceToNowStrict, addMilliseconds } from 'date-fns';

interface MutedContentCardProps {
  id: string;
  keywords: string[];
  startTime: number; // Timestamp when muting started
  durationMs: number; // Duration in milliseconds
  onRemove: (id: string) => void;
  onEdit?: (id: string) => void; // Optional edit functionality
}

export function MutedContentCard({
  id,
  keywords,
  startTime,
  durationMs,
  onRemove,
  onEdit,
}: MutedContentCardProps) {
    const [timeLeft, setTimeLeft] = React.useState<string>("");
    const endTime = startTime + durationMs;

    React.useEffect(() => {
        const calculateTimeLeft = () => {
            const now = Date.now();
            if (now >= endTime) {
                setTimeLeft("Expired");
            } else {
                // Calculate remaining time
                const endDateTime = addMilliseconds(new Date(startTime), durationMs);
                 setTimeLeft(formatDistanceToNowStrict(endDateTime, { addSuffix: true }));
            }
        };

        calculateTimeLeft();
        const intervalId = setInterval(calculateTimeLeft, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, [startTime, durationMs, endTime]);


  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-200 border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex justify-between items-center">
          <span>Muted Content</span>
           <Badge variant={timeLeft === "Expired" ? "destructive" : "outline"} className="flex items-center gap-1 text-xs">
             <Clock className="h-3 w-3" />
             {timeLeft}
           </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <Badge key={keyword} variant="secondary" className="bg-accent text-accent-foreground">
              {keyword}
            </Badge>
          ))}
        </div>
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
