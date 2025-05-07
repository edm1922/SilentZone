"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeywordInput } from "@/components/keyword-input";
import { DurationSelector } from "@/components/duration-selector";
import { PlatformSelector, Platform, availablePlatforms } from "@/components/platform-selector";
import { AdvancedFilterOptions } from "@/components/advanced-filter-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseMuteRules } from "@/hooks/use-supabase-mute-rules";

export default function CreateMuteRulePage() {
  const [keywords, setKeywords] = React.useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = React.useState<string>("1d");
  const [durationMs, setDurationMs] = React.useState<number>(24 * 60 * 60 * 1000); // Default 1 day
  const customDurationRef = React.useRef<number | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([availablePlatforms[0]]); // Default to "All Platforms"
  const [useRegex, setUseRegex] = React.useState<boolean>(false);
  const [caseSensitive, setCaseSensitive] = React.useState<boolean>(false);
  const [matchWholeWord, setMatchWholeWord] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();
  const { addMuteRule } = useSupabaseMuteRules();

  const handleDurationChange = (value: string, customDurationValue?: number) => {
    console.log("CRITICAL: handleDurationChange called with value:", value, "and customDurationValue:", customDurationValue);
    setSelectedDuration(value);

    // If a custom duration value is provided, use it directly
    if (customDurationValue !== undefined) {
      console.log("CRITICAL: Setting custom duration:", customDurationValue);
      console.log("CRITICAL: Duration in days:", customDurationValue / (24 * 60 * 60 * 1000));
      console.log("CRITICAL: Duration in hours:", customDurationValue / (60 * 60 * 1000));

      // Calculate expiry date for reference
      if (customDurationValue > 0) {
        const expiryDate = new Date(Date.now() + customDurationValue);
        console.log("CRITICAL: Will expire on:", expiryDate.toLocaleString());
      }

      console.log("CRITICAL: Setting durationMs state to:", customDurationValue);
      setDurationMs(customDurationValue);

      // Store the custom duration in a ref for immediate access
      customDurationRef.current = customDurationValue;
      console.log("CRITICAL: Stored custom duration in ref:", customDurationRef.current);

      // Log the current state after a small delay
      setTimeout(() => {
        console.log("CRITICAL: After timeout, selectedDuration is:", selectedDuration);
        console.log("CRITICAL: After timeout, durationMs is:", durationMs);
        console.log("CRITICAL: After timeout, customDurationRef is:", customDurationRef.current);
      }, 200);

      return;
    }

    // Otherwise, set duration in milliseconds based on selection
    let newDurationMs = 0;

    switch (value) {
      case "1h":
        newDurationMs = 1 * 60 * 60 * 1000; // 1 hour
        break;
      case "4h":
        newDurationMs = 4 * 60 * 60 * 1000; // 4 hours
        break;
      case "8h":
        newDurationMs = 8 * 60 * 60 * 1000; // 8 hours
        break;
      case "12h":
        newDurationMs = 12 * 60 * 60 * 1000; // 12 hours
        break;
      case "1d":
        newDurationMs = 24 * 60 * 60 * 1000; // 1 day
        break;
      case "3d":
        newDurationMs = 3 * 24 * 60 * 60 * 1000; // 3 days
        break;
      case "5d":
        newDurationMs = 5 * 24 * 60 * 60 * 1000; // 5 days
        break;
      case "1w":
        newDurationMs = 7 * 24 * 60 * 60 * 1000; // 1 week
        break;
      case "2w":
        newDurationMs = 14 * 24 * 60 * 60 * 1000; // 2 weeks
        break;
      case "1m":
        newDurationMs = 30 * 24 * 60 * 60 * 1000; // 1 month
        break;
      case "3m":
        newDurationMs = 90 * 24 * 60 * 60 * 1000; // 3 months
        break;
      case "6m":
        newDurationMs = 180 * 24 * 60 * 60 * 1000; // 6 months
        break;
      case "permanent":
        newDurationMs = -1; // Permanent
        break;
      case "custom":
        // Keep current value for custom if no customDurationValue was provided
        console.log("Custom selected but no duration value provided, keeping current value:", durationMs);
        return;
    }

    console.log(`Setting ${value} duration:`, newDurationMs);
    setDurationMs(newDurationMs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (keywords.length === 0) {
      toast({
        title: "No Keywords",
        description: "Please add at least one keyword or topic to mute.",
        variant: "destructive",
      });
      return;
    }

    if (durationMs <= 0 && selectedDuration === 'custom') {
      toast({
        title: "Invalid Duration",
        description: "Please select a valid duration.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Create a timeout promise that rejects after 10 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Operation timed out. The request took too long to complete."));
      }, 10000); // 10 seconds timeout
    });

    try {
      // Log detailed information about the duration
      console.log("CRITICAL: SUBMIT - Selected duration type:", selectedDuration);
      console.log("CRITICAL: SUBMIT - Duration in milliseconds:", durationMs);

      if (durationMs > 0) {
        const expiryDate = new Date(Date.now() + durationMs);
        console.log("CRITICAL: SUBMIT - Will expire on:", expiryDate.toLocaleString());
        console.log("CRITICAL: SUBMIT - Duration in days:", durationMs / (24 * 60 * 60 * 1000));
        console.log("CRITICAL: SUBMIT - Duration in hours:", durationMs / (60 * 60 * 1000));
      } else if (durationMs === -1) {
        console.log("CRITICAL: SUBMIT - Duration: Permanent (never expires)");
      } else {
        console.log("CRITICAL: SUBMIT - WARNING: Duration is zero or negative:", durationMs);
      }

      // Check if this is a custom duration
      if (selectedDuration === "custom") {
        console.log("CRITICAL: SUBMIT - This is a custom duration");

        // Force the correct duration calculation one more time
        if (customDurationRef.current) {
          console.log("CRITICAL: SUBMIT - Forcing custom duration calculation");
          const customDuration = customDurationRef.current;
          console.log("CRITICAL: SUBMIT - Custom duration from ref:", customDuration);
        }
      }

      // Determine the final duration to use
      let finalDurationMs = durationMs;

      // If this is a custom duration and we have a ref value, use that
      if (selectedDuration === "custom" && customDurationRef.current !== null) {
        console.log("CRITICAL: SUBMIT - Using custom duration from ref:", customDurationRef.current);
        finalDurationMs = customDurationRef.current;
      }

      console.log("CRITICAL: SUBMIT - Final duration to use:", finalDurationMs);
      console.log("CRITICAL: SUBMIT - Final duration in hours:", finalDurationMs / (60 * 60 * 1000));

      // Create a clean object with only the necessary fields
      const ruleData = {
        keywords: [...keywords], // Create a new array to avoid reference issues
        platforms: selectedPlatforms.map(p => ({ id: p.id, name: p.name })), // Only keep id and name
        start_time: Date.now(),
        duration_ms: finalDurationMs,
        use_regex: useRegex,
        case_sensitive: caseSensitive,
        match_whole_word: matchWholeWord,
      };

      // Log the data being sent to Supabase for debugging
      console.log("Creating mute rule with data:", JSON.stringify(ruleData));

      try {
        // Race between the actual operation and the timeout
        const createdRule = await Promise.race([
          addMuteRule(ruleData),
          timeoutPromise
        ]) as any;

        console.log("Rule created successfully:", createdRule);

        toast({
          title: "Mute Rule Created",
          description: "Your mute rule has been created successfully.",
        });

        // Navigate to dashboard after a short delay to allow Supabase to sync
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } catch (innerError) {
        console.error("Inner error creating rule:", innerError);

        if (innerError.message?.includes("timed out")) {
          toast({
            title: "Operation Timed Out",
            description: "The request is taking too long. The rule might still be created. Please check the dashboard.",
            variant: "destructive",
          });

          // Navigate to dashboard after timeout to check if the rule was created
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        } else {
          throw innerError;
        }
      }
    } catch (error) {
      console.error("Error creating mute rule:", error);
      toast({
        title: "Error",
        description: `Failed to create mute rule: ${error.message || "Unknown error"}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10">
      <Button
        variant="ghost"
        className="mb-6 pl-0 flex items-center text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create Mute Rule</CardTitle>
          <CardDescription>
            Create a new rule to mute content across platforms
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Keywords or Topics
              </label>
              <KeywordInput
                keywords={keywords}
                onKeywordsChange={setKeywords}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Platforms
              </label>
              <PlatformSelector
                selectedPlatforms={selectedPlatforms}
                onPlatformsChange={(platforms) => {
                  setSelectedPlatforms(platforms);
                  // Analytics removed
                }}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Mute Duration
              </label>
              <DurationSelector
                selectedDuration={selectedDuration}
                onDurationChange={(value, customDurationValue) => {
                  console.log("CRITICAL: DurationSelector onDurationChange called with:", value, customDurationValue);
                  handleDurationChange(value, customDurationValue);
                }}
                customDurationMs={durationMs}
              />
            </div>

            <AdvancedFilterOptions
              useRegex={useRegex}
              onUseRegexChange={(value) => {
                setUseRegex(value);
              }}
              caseSensitive={caseSensitive}
              onCaseSensitiveChange={(value) => {
                setCaseSensitive(value);
              }}
              matchWholeWord={matchWholeWord}
              onMatchWholeWordChange={(value) => {
                setMatchWholeWord(value);
              }}
            />

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Mute Rule"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
