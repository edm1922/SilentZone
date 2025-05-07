"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DurationSelector } from "@/components/duration-selector";
import { DurationBadge } from "@/components/duration-badge";
import { Clock, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EditDurationDialogProps {
  ruleId: string;
  currentDurationMs: number;
  startTime: number;
  onDurationUpdate: (ruleId: string, newDurationMs: number) => Promise<boolean>;
}

export function EditDurationDialog({
  ruleId,
  currentDurationMs,
  startTime,
  onDurationUpdate
}: EditDurationDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDuration, setSelectedDuration] = React.useState<string>("");
  const [durationMs, setDurationMs] = React.useState<number>(currentDurationMs);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      // Try to determine the closest duration option
      if (currentDurationMs === -1) {
        setSelectedDuration("permanent");
      } else if (currentDurationMs === 60 * 60 * 1000) {
        setSelectedDuration("1h");
      } else if (currentDurationMs === 24 * 60 * 60 * 1000) {
        setSelectedDuration("1d");
      } else if (currentDurationMs === 7 * 24 * 60 * 60 * 1000) {
        setSelectedDuration("1w");
      } else if (currentDurationMs === 30 * 24 * 60 * 60 * 1000) {
        setSelectedDuration("1m");
      } else {
        setSelectedDuration("custom");
      }
      setDurationMs(currentDurationMs);
    }
  }, [open, currentDurationMs]);

  const handleDurationChange = (value: string, duration: number) => {
    setSelectedDuration(value);
    setDurationMs(duration);
  };

  const handleSubmit = async () => {
    if (durationMs === 0 && selectedDuration !== 'permanent') {
      toast({
        title: "Invalid Duration",
        description: "Please select a valid duration.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onDurationUpdate(ruleId, durationMs);
      
      if (success) {
        toast({
          title: "Duration Updated",
          description: "The mute rule duration has been updated successfully.",
        });
        setOpen(false);
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update the duration. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating duration:", error);
      toast({
        title: "Error",
        description: `Failed to update duration: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Edit2 className="h-3.5 w-3.5 mr-1" />
          Edit Duration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Mute Duration</DialogTitle>
          <DialogDescription>
            Change how long this content will be muted
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center mb-4">
            <span className="text-sm font-medium mr-2">Current Duration:</span>
            <DurationBadge startTime={startTime} durationMs={currentDurationMs} />
          </div>
          
          <DurationSelector
            selectedDuration={selectedDuration}
            onDurationChange={handleDurationChange}
            customDurationMs={currentDurationMs}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Duration"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
