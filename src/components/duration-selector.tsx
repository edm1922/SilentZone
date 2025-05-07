
"use client";

import * as React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Clock } from "lucide-react";
import { format, addDays, addWeeks, addMonths, formatDistanceToNowStrict } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DurationOption = {
  value: string;
  label: string;
  durationMs: number; // Duration in milliseconds
};

const durationOptions: DurationOption[] = [
  // Short durations
  { value: "1h", label: "1 Hour", durationMs: 1 * 60 * 60 * 1000 },
  { value: "4h", label: "4 Hours", durationMs: 4 * 60 * 60 * 1000 },
  { value: "8h", label: "8 Hours", durationMs: 8 * 60 * 60 * 1000 },
  { value: "12h", label: "12 Hours", durationMs: 12 * 60 * 60 * 1000 },

  // Days
  { value: "1d", label: "1 Day", durationMs: 24 * 60 * 60 * 1000 },
  { value: "3d", label: "3 Days", durationMs: 3 * 24 * 60 * 60 * 1000 },
  { value: "5d", label: "5 Days", durationMs: 5 * 24 * 60 * 60 * 1000 },

  // Weeks
  { value: "1w", label: "1 Week", durationMs: 7 * 24 * 60 * 60 * 1000 },
  { value: "2w", label: "2 Weeks", durationMs: 14 * 24 * 60 * 60 * 1000 },

  // Months
  { value: "1m", label: "1 Month", durationMs: 30 * 24 * 60 * 60 * 1000 },
  { value: "3m", label: "3 Months", durationMs: 90 * 24 * 60 * 60 * 1000 },
  { value: "6m", label: "6 Months", durationMs: 180 * 24 * 60 * 60 * 1000 },

  // Special options
  { value: "permanent", label: "Permanent", durationMs: -1 }, // -1 indicates permanent
  { value: "custom", label: "Custom", durationMs: 0 }, // Placeholder, actual duration set elsewhere
];

interface DurationSelectorProps {
  selectedDuration: string;
  onDurationChange: (value: string, durationMs: number) => void;
  className?: string;
  customDurationMs?: number; // For custom duration
}

export function DurationSelector({
  selectedDuration,
  onDurationChange,
  className,
  customDurationMs = 0,
}: DurationSelectorProps) {
  const [customDate, setCustomDate] = React.useState<Date | undefined>(
    customDurationMs > 0 ? new Date(Date.now() + customDurationMs) : addWeeks(new Date(), 1)
  );
  const [customTimeUnit, setCustomTimeUnit] = React.useState<string>("hours"); // Default to hours instead of days
  const [customTimeValue, setCustomTimeValue] = React.useState<string>("7");
  const [isCustomDateOpen, setIsCustomDateOpen] = React.useState(false);
  const [customType, setCustomType] = React.useState<"date" | "duration">("duration");

  // Initialize with the correct unit when component mounts
  React.useEffect(() => {
    console.log("CRITICAL: DurationSelector mounted with customTimeUnit:", customTimeUnit);

    // If this is a custom duration, calculate and send the initial value
    if (selectedDuration === "custom") {
      console.log("CRITICAL: Initial custom duration selected, calculating...");
      handleCustomDurationChange();
    }
  }, []);

  // Update when customTimeUnit changes
  React.useEffect(() => {
    console.log("CRITICAL: customTimeUnit changed to:", customTimeUnit);
    if (selectedDuration === "custom" && customType === "duration") {
      handleCustomDurationChange();
    }
  }, [customTimeUnit]);

  // Handle radio option change
  const handleValueChange = (value: string) => {
    const selectedOption = durationOptions.find(opt => opt.value === value);
    if (selectedOption) {
      if (value === "custom") {
        // For custom, calculate based on the current custom settings
        if (customType === "date" && customDate) {
          const now = Date.now();
          const durationMs = customDate.getTime() - now;
          const validDurationMs = durationMs > 0 ? durationMs : 0;

          console.log("Custom date selected (from handleValueChange):", customDate);
          console.log("Current time:", new Date(now));
          console.log("Time difference (ms):", durationMs);
          console.log("Valid duration (ms):", validDurationMs);

          onDurationChange(value, validDurationMs);
        } else {
          // Calculate based on custom time unit and value
          let durationMs = parseInt(customTimeValue) * 24 * 60 * 60 * 1000; // Default to days
          if (customTimeUnit === "hours") {
            durationMs = parseInt(customTimeValue) * 60 * 60 * 1000;
          } else if (customTimeUnit === "weeks") {
            durationMs = parseInt(customTimeValue) * 7 * 24 * 60 * 60 * 1000;
          } else if (customTimeUnit === "months") {
            durationMs = parseInt(customTimeValue) * 30 * 24 * 60 * 60 * 1000;
          }

          console.log("Custom duration selected:", durationMs, "ms");
          console.log("Custom time value:", customTimeValue, customTimeUnit);

          onDurationChange(value, durationMs);
        }
        setIsCustomDateOpen(customType === "date");
      } else {
        console.log("Standard duration selected:", selectedOption.label, selectedOption.durationMs, "ms");
        onDurationChange(value, selectedOption.durationMs);
      }
    }
  };

  // Handle custom date change
  const handleCustomDateChange = (date: Date | undefined) => {
    if (date) {
      setCustomDate(date);
      const now = Date.now();
      const durationMs = date.getTime() - now;
      const validDurationMs = durationMs > 0 ? durationMs : 0;

      console.log("Custom date selected:", date);
      console.log("Current time:", new Date(now));
      console.log("Time difference (ms):", durationMs);
      console.log("Valid duration (ms):", validDurationMs);

      onDurationChange("custom", validDurationMs);
    }
  };

  // Handle custom duration change
  const handleCustomDurationChange = () => {
    // Parse the custom time value as a number
    const timeValue = parseInt(customTimeValue);

    // Calculate duration in milliseconds based on the selected unit
    let durationMs = 0;

    console.log("CRITICAL: handleCustomDurationChange - Current time unit is:", customTimeUnit);

    // Calculate based on the current unit
    switch (customTimeUnit) {
      case "hours":
        durationMs = timeValue * 60 * 60 * 1000;
        console.log(`CRITICAL: handleCustomDurationChange - Converting ${timeValue} hours to ${durationMs} ms`);
        break;
      case "days":
        durationMs = timeValue * 24 * 60 * 60 * 1000;
        console.log(`CRITICAL: handleCustomDurationChange - Converting ${timeValue} days to ${durationMs} ms`);
        break;
      case "weeks":
        durationMs = timeValue * 7 * 24 * 60 * 60 * 1000;
        console.log(`CRITICAL: handleCustomDurationChange - Converting ${timeValue} weeks to ${durationMs} ms`);
        break;
      case "months":
        // Use a more accurate calculation for months
        // Average month length is closer to 30.44 days
        durationMs = Math.round(timeValue * 30.44 * 24 * 60 * 60 * 1000);
        console.log(`CRITICAL: handleCustomDurationChange - Converting ${timeValue} months to ${durationMs} ms`);

        // For debugging, calculate the future date
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + timeValue);
        const actualDurationMs = futureDate.getTime() - Date.now();
        console.log(`CRITICAL: handleCustomDurationChange - Actual future date: ${futureDate.toLocaleString()}`);
        console.log(`CRITICAL: handleCustomDurationChange - Actual duration: ${actualDurationMs} ms`);

        // Use the more accurate calculation
        durationMs = actualDurationMs;
        break;
      default:
        console.error(`CRITICAL: handleCustomDurationChange - Unknown time unit: ${customTimeUnit}`);
        // Default to days if unit is unknown
        durationMs = timeValue * 24 * 60 * 60 * 1000;
    }

    console.log("CRITICAL: handleCustomDurationChange - Custom duration calculated:", durationMs, "ms");
    console.log("CRITICAL: handleCustomDurationChange - Custom time value:", timeValue, customTimeUnit);

    // Calculate the future date for reference
    const futureDate = new Date(Date.now() + durationMs);
    console.log("CRITICAL: handleCustomDurationChange - Will expire on:", futureDate.toLocaleString());

    // Convert to different units for debugging
    const hours = durationMs / (60 * 60 * 1000);
    const days = durationMs / (24 * 60 * 60 * 1000);
    console.log(`CRITICAL: handleCustomDurationChange - Duration in hours: ${hours}`);
    console.log(`CRITICAL: handleCustomDurationChange - Duration in days: ${days}`);

    // Pass the duration to the parent component
    console.log(`CRITICAL: handleCustomDurationChange - Calling onDurationChange with value "custom" and durationMs ${durationMs}`);
    onDurationChange("custom", durationMs);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <RadioGroup
        value={selectedDuration}
        onValueChange={handleValueChange}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
      >
        {/* Group by category */}
        <div className="col-span-full mb-1 mt-2">
          <h3 className="text-sm font-medium text-muted-foreground">Hours</h3>
        </div>
        {durationOptions.slice(0, 4).map((option) => (
          <div key={option.value} className="flex items-center space-x-2 border rounded-md p-2 hover:bg-accent">
            <RadioGroupItem value={option.value} id={`duration-${option.value}`} />
            <Label htmlFor={`duration-${option.value}`} className="cursor-pointer">
              {option.label}
            </Label>
          </div>
        ))}

        <div className="col-span-full mb-1 mt-2">
          <h3 className="text-sm font-medium text-muted-foreground">Days</h3>
        </div>
        {durationOptions.slice(4, 7).map((option) => (
          <div key={option.value} className="flex items-center space-x-2 border rounded-md p-2 hover:bg-accent">
            <RadioGroupItem value={option.value} id={`duration-${option.value}`} />
            <Label htmlFor={`duration-${option.value}`} className="cursor-pointer">
              {option.label}
            </Label>
          </div>
        ))}

        <div className="col-span-full mb-1 mt-2">
          <h3 className="text-sm font-medium text-muted-foreground">Weeks</h3>
        </div>
        {durationOptions.slice(7, 9).map((option) => (
          <div key={option.value} className="flex items-center space-x-2 border rounded-md p-2 hover:bg-accent">
            <RadioGroupItem value={option.value} id={`duration-${option.value}`} />
            <Label htmlFor={`duration-${option.value}`} className="cursor-pointer">
              {option.label}
            </Label>
          </div>
        ))}

        <div className="col-span-full mb-1 mt-2">
          <h3 className="text-sm font-medium text-muted-foreground">Months</h3>
        </div>
        {durationOptions.slice(9, 12).map((option) => (
          <div key={option.value} className="flex items-center space-x-2 border rounded-md p-2 hover:bg-accent">
            <RadioGroupItem value={option.value} id={`duration-${option.value}`} />
            <Label htmlFor={`duration-${option.value}`} className="cursor-pointer">
              {option.label}
            </Label>
          </div>
        ))}

        <div className="col-span-full mb-1 mt-2">
          <h3 className="text-sm font-medium text-muted-foreground">Special</h3>
        </div>
        {durationOptions.slice(12).map((option) => (
          <div key={option.value} className="flex items-center space-x-2 border rounded-md p-2 hover:bg-accent">
            <RadioGroupItem value={option.value} id={`duration-${option.value}`} />
            <Label htmlFor={`duration-${option.value}`} className="cursor-pointer">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {selectedDuration === "custom" && (
        <div className="border rounded-md p-4 mt-2">
          <div className="flex space-x-4 mb-4">
            <Button
              variant={customType === "duration" ? "default" : "outline"}
              size="sm"
              onClick={() => setCustomType("duration")}
            >
              <Clock className="h-4 w-4 mr-2" />
              Time Period
            </Button>
            <Button
              variant={customType === "date" ? "default" : "outline"}
              size="sm"
              onClick={() => setCustomType("date")}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Specific Date
            </Button>
          </div>

          {customType === "date" ? (
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label className="text-sm font-medium">Mute Until</Label>
                <Popover open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDate ? format(customDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={handleCustomDateChange}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {customDate && (
                <div className="text-sm text-muted-foreground">
                  Content will be muted until {format(customDate, "PPP 'at' p")}
                  <div className="mt-1 text-xs">
                    ({formatDistanceToNowStrict(customDate, { addSuffix: true })})
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Label htmlFor="customTimeValue" className="text-sm font-medium">Duration</Label>
                  <Input
                    id="customTimeValue"
                    type="number"
                    min="1"
                    value={customTimeValue}
                    onChange={(e) => {
                      console.log("CRITICAL: Time value changed to:", e.target.value);

                      // Store the new value
                      const newValue = e.target.value;
                      setCustomTimeValue(newValue);

                      // Calculate the new duration immediately with the new value
                      // instead of waiting for state update
                      let durationMs = 0;
                      const timeValue = parseInt(newValue);

                      if (customTimeUnit === "hours") {
                        durationMs = timeValue * 60 * 60 * 1000;
                        console.log(`CRITICAL: Direct calculation - ${timeValue} hours = ${durationMs} ms`);
                      } else if (customTimeUnit === "days") {
                        durationMs = timeValue * 24 * 60 * 60 * 1000;
                        console.log(`CRITICAL: Direct calculation - ${timeValue} days = ${durationMs} ms`);
                      } else if (customTimeUnit === "weeks") {
                        durationMs = timeValue * 7 * 24 * 60 * 60 * 1000;
                        console.log(`CRITICAL: Direct calculation - ${timeValue} weeks = ${durationMs} ms`);
                      } else if (customTimeUnit === "months") {
                        // Use a more accurate calculation for months
                        const futureDate = new Date();
                        futureDate.setMonth(futureDate.getMonth() + timeValue);
                        durationMs = futureDate.getTime() - Date.now();
                        console.log(`CRITICAL: Direct calculation - ${timeValue} months = ${durationMs} ms`);
                        console.log(`CRITICAL: Direct calculation - Future date: ${futureDate.toLocaleString()}`);
                      }

                      // Pass the duration directly to the parent
                      console.log(`CRITICAL: Directly calling onDurationChange with "custom" and ${durationMs} ms`);
                      onDurationChange("custom", durationMs);
                    }}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="customTimeUnit" className="text-sm font-medium">Unit</Label>
                  <Select
                    value={customTimeUnit}
                    onValueChange={(value) => {
                      console.log("CRITICAL: Time unit changed to:", value);
                      // Store the previous value for debugging
                      const prevValue = customTimeUnit;
                      console.log("CRITICAL: Previous time unit was:", prevValue);

                      // Update the state
                      setCustomTimeUnit(value);

                      // Calculate the new duration immediately with the new value
                      // instead of waiting for state update
                      let durationMs = 0;
                      const timeValue = parseInt(customTimeValue);

                      if (value === "hours") {
                        durationMs = timeValue * 60 * 60 * 1000;
                        console.log(`CRITICAL: Direct calculation - ${timeValue} hours = ${durationMs} ms`);
                      } else if (value === "days") {
                        durationMs = timeValue * 24 * 60 * 60 * 1000;
                        console.log(`CRITICAL: Direct calculation - ${timeValue} days = ${durationMs} ms`);
                      } else if (value === "weeks") {
                        durationMs = timeValue * 7 * 24 * 60 * 60 * 1000;
                        console.log(`CRITICAL: Direct calculation - ${timeValue} weeks = ${durationMs} ms`);
                      } else if (value === "months") {
                        // Use a more accurate calculation for months
                        const futureDate = new Date();
                        futureDate.setMonth(futureDate.getMonth() + timeValue);
                        durationMs = futureDate.getTime() - Date.now();
                        console.log(`CRITICAL: Direct calculation - ${timeValue} months = ${durationMs} ms`);
                        console.log(`CRITICAL: Direct calculation - Future date: ${futureDate.toLocaleString()}`);
                      }

                      // Pass the duration directly to the parent
                      console.log(`CRITICAL: Directly calling onDurationChange with "custom" and ${durationMs} ms`);
                      onDurationChange("custom", durationMs);
                    }}
                  >
                    <SelectTrigger id="customTimeUnit" className="mt-1">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Show preview of when the mute will expire */}
              {parseInt(customTimeValue) > 0 && (
                <div className="text-sm text-muted-foreground">
                  Content will be muted for {customTimeValue} {customTimeUnit}
                  <div className="mt-1 text-xs">
                    (until {format(
                      (() => {
                        const now = new Date();
                        let futureDate = now;
                        const value = parseInt(customTimeValue);

                        if (customTimeUnit === "hours") {
                          futureDate = new Date(now.getTime() + value * 60 * 60 * 1000);
                        } else if (customTimeUnit === "days") {
                          futureDate = new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
                        } else if (customTimeUnit === "weeks") {
                          futureDate = new Date(now.getTime() + value * 7 * 24 * 60 * 60 * 1000);
                        } else if (customTimeUnit === "months") {
                          // Use the native Date API for accurate month calculation
                          futureDate = new Date(now);
                          futureDate.setMonth(futureDate.getMonth() + value);
                        }

                        return futureDate;
                      })(),
                      "PPP 'at' p"
                    )})
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
