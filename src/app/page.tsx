
"use client";

import * as React from "react";
import { detectThemes } from "@/ai/flows/detect-themes-using-nlp";
import { suggestRelatedTopics } from "@/ai/flows/suggest-related-topics"; // Assuming this exists for related topic suggestions
import { KeywordInput } from "@/components/keyword-input";
import { DurationSelector } from "@/components/duration-selector";
import { MutedContentCard } from "@/components/muted-content-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface MutedItem {
  id: string;
  keywords: string[];
  startTime: number;
  durationMs: number;
}

export default function Home() {
  const [keywords, setKeywords] = React.useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = React.useState<string>("1d");
  const [durationMs, setDurationMs] = React.useState<number>(24 * 60 * 60 * 1000); // Default 1 day
  const [mutedItems, setMutedItems] = React.useState<MutedItem[]>([]);
  const [suggestedThemes, setSuggestedThemes] = React.useState<string[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleKeywordsChange = (newKeywords: string[]) => {
    setKeywords(newKeywords);
    // Optionally trigger AI theme detection when keywords change significantly
    // Debounce this call in a real app
    if (newKeywords.length > 0) {
       handleDetectThemes(newKeywords.join(" "));
    } else {
        setSuggestedThemes([]); // Clear suggestions if no keywords
    }
  };

  const handleDurationChange = (value: string, ms: number) => {
    setSelectedDuration(value);
    setDurationMs(ms);
    // If 'custom' is selected, you might open a date picker here
  };

  const handleDetectThemes = async (content: string) => {
    if (!content) return;
    setIsLoadingThemes(true);
    setError(null);
    try {
      const result = await detectThemes({ content });
      // Filter out themes that are already included as keywords
      const newThemes = result.themes.filter(theme =>
        !keywords.some(kw => kw.toLowerCase() === theme.toLowerCase())
      );
      setSuggestedThemes(newThemes);
    } catch (err) {
      console.error("Error detecting themes:", err);
      setError("Failed to fetch theme suggestions. Please try again.");
      setSuggestedThemes([]); // Clear suggestions on error
    } finally {
      setIsLoadingThemes(false);
    }
  };

    const handleAddSuggestedTheme = (theme: string) => {
        if (!keywords.includes(theme)) {
            const newKeywords = [...keywords, theme];
            setKeywords(newKeywords);
            setSuggestedThemes(suggestedThemes.filter(t => t !== theme));
             // Re-run theme detection based on the updated keyword list if desired
            // handleDetectThemes(newKeywords.join(" "));
        }
    }

  const handleAddMute = () => {
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

    const newItem: MutedItem = {
      id: crypto.randomUUID(),
      keywords: [...keywords], // Create a copy
      startTime: Date.now(),
      durationMs: durationMs,
    };
    setMutedItems([...mutedItems, newItem]);
    setKeywords([]); // Clear input after adding
    setSuggestedThemes([]); // Clear suggestions
    setSelectedDuration("1d"); // Reset duration
    setDurationMs(24 * 60 * 60 * 1000); // Reset duration ms
     toast({
        title: "Content Muted",
        description: `Muting ${newItem.keywords.join(', ')} for ${selectedDuration === 'custom' ? 'a custom duration' : selectedDuration}.`,
      });
  };

  const handleRemoveMute = (idToRemove: string) => {
    setMutedItems(mutedItems.filter((item) => item.id !== idToRemove));
     toast({
        title: "Mute Removed",
        description: "The selected mute rule has been removed.",
      });
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-3xl space-y-8">
        <header className="text-center space-y-2">
          <ShieldCheck className="mx-auto h-12 w-12 text-accent" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            ContentGuard
          </h1>
          <p className="text-muted-foreground">
            Filter the web, your way. Mute keywords and topics across platforms.
          </p>
        </header>

        <Card className="shadow-lg border border-border">
          <CardHeader>
            <CardTitle>Create a New Mute Rule</CardTitle>
            <CardDescription>
              Enter keywords or topics you want to avoid, and set a duration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Keywords / Topics
              </label>
              <KeywordInput
                keywords={keywords}
                onKeywordsChange={handleKeywordsChange}
              />
            </div>

             {/* AI Suggestions Section */}
            {(isLoadingThemes || suggestedThemes.length > 0 || error) && (
                <div className="space-y-2 rounded-md border border-dashed border-border p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Wand2 className="h-4 w-4" />
                    <span>AI Suggestions</span>
                    {isLoadingThemes && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                 {error && (
                     <Alert variant="destructive" className="mt-2">
                        <AlertDescription>{error}</AlertDescription>
                     </Alert>
                 )}
                {!isLoadingThemes && suggestedThemes.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                    {suggestedThemes.map((theme) => (
                        <Badge
                        key={theme}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent/10 hover:border-accent"
                        onClick={() => handleAddSuggestedTheme(theme)}
                        title={`Add "${theme}" to keywords`}
                        >
                        + {theme}
                        </Badge>
                    ))}
                    </div>
                )}
                 {!isLoadingThemes && suggestedThemes.length === 0 && !error && keywords.length > 0 && (
                    <p className="text-xs text-muted-foreground pt-2">No additional themes found based on current keywords.</p>
                 )}
                </div>
            )}


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
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddMute} className="w-full" disabled={isLoadingThemes}>
              {isLoadingThemes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Activate Mute
            </Button>
          </CardFooter>
        </Card>

        {mutedItems.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Active Mutes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mutedItems.map((item) => (
                <MutedContentCard
                    key={item.id}
                    id={item.id}
                    keywords={item.keywords}
                    startTime={item.startTime}
                    durationMs={item.durationMs}
                    onRemove={handleRemoveMute}
                />
                ))}
            </div>

          </div>
        )}

        {mutedItems.length === 0 && !isLoadingThemes && (
             <Alert className="mt-8 border-border">
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>All Clear!</AlertTitle>
                <AlertDescription>
                You have no active mute rules. Add some keywords above to start filtering.
                </AlertDescription>
            </Alert>
        )}
      </div>
    </main>
  );
}
