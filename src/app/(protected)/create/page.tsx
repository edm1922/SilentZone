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
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([availablePlatforms[0]]); // Default to "All Platforms"
  const [useRegex, setUseRegex] = React.useState<boolean>(false);
  const [caseSensitive, setCaseSensitive] = React.useState<boolean>(false);
  const [matchWholeWord, setMatchWholeWord] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();
  const { addMuteRule } = useSupabaseMuteRules();

  const handleDurationChange = (value: string) => {
    setSelectedDuration(value);

    // Set duration in milliseconds based on selection
    switch (value) {
      case "1d":
        setDurationMs(24 * 60 * 60 * 1000); // 1 day
        break;
      case "3d":
        setDurationMs(3 * 24 * 60 * 60 * 1000); // 3 days
        break;
      case "1w":
        setDurationMs(7 * 24 * 60 * 60 * 1000); // 1 week
        break;
      case "custom":
        // Keep current value for custom
        break;
    }

    // Analytics event removed
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
      // Create a clean object with only the necessary fields
      const ruleData = {
        keywords: [...keywords], // Create a new array to avoid reference issues
        platforms: selectedPlatforms.map(p => ({ id: p.id, name: p.name })), // Only keep id and name
        start_time: Date.now(),
        duration_ms: durationMs,
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
                onDurationChange={handleDurationChange}
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
