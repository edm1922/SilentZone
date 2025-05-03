
"use client";

import * as React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DurationOption = {
  value: string;
  label: string;
  durationMs: number; // Duration in milliseconds
};

const durationOptions: DurationOption[] = [
  { value: "1d", label: "1 Day", durationMs: 24 * 60 * 60 * 1000 },
  { value: "3d", label: "3 Days", durationMs: 3 * 24 * 60 * 60 * 1000 },
  { value: "1w", label: "1 Week", durationMs: 7 * 24 * 60 * 60 * 1000 },
  { value: "custom", label: "Custom", durationMs: 0 }, // Placeholder, actual duration set elsewhere
];

interface DurationSelectorProps {
  selectedDuration: string;
  onDurationChange: (value: string, durationMs: number) => void;
  className?: string;
}

export function DurationSelector({
  selectedDuration,
  onDurationChange,
  className,
}: DurationSelectorProps) {

  const handleValueChange = (value: string) => {
    const selectedOption = durationOptions.find(opt => opt.value === value);
    if (selectedOption) {
        onDurationChange(value, selectedOption.durationMs);
    }
    // Handle 'custom' separately if needed, e.g., open a date picker
  };


  return (
    <RadioGroup
      value={selectedDuration}
      onValueChange={handleValueChange}
      className={cn("flex flex-wrap gap-4", className)}
    >
      {durationOptions.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <RadioGroupItem value={option.value} id={`duration-${option.value}`} />
          <Label htmlFor={`duration-${option.value}`} className="cursor-pointer">
            {option.label}
          </Label>
        </div>
      ))}
      {/* Consider adding a date picker input for the 'custom' option here */}
    </RadioGroup>
  );
}
