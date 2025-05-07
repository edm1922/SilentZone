"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseMuteRules } from '@/hooks/use-supabase-mute-rules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Platform options
const PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'news', name: 'News Sites' },
  { id: 'all', name: 'All Platforms' },
];

// Duration options in milliseconds
const DURATIONS = [
  { id: '3600000', name: '1 hour', value: 3600000 },
  { id: '86400000', name: '1 day', value: 86400000 },
  { id: '604800000', name: '1 week', value: 604800000 },
  { id: '2592000000', name: '30 days', value: 2592000000 },
  { id: '31536000000', name: '1 year', value: 31536000000 },
  { id: 'permanent', name: 'Permanent', value: -1 },
];

export default function CreateMuteRuleForm() {
  const router = useRouter();

  // Form state
  const [keywords, setKeywords] = useState<string[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['all']);
  const [duration, setDuration] = useState<number>(DURATIONS[2].value); // Default to 1 week
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add keyword to the list
  const addKeyword = () => {
    const trimmedKeyword = currentKeyword.trim();
    if (trimmedKeyword && !keywords.includes(trimmedKeyword)) {
      setKeywords([...keywords, trimmedKeyword]);
      setCurrentKeyword('');
    }
  };

  // Remove keyword from the list
  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  // Toggle platform selection
  const togglePlatform = (platformId: string) => {
    if (platformId === 'all') {
      // If 'all' is selected, clear other selections
      setSelectedPlatforms(['all']);
    } else {
      // If a specific platform is selected, remove 'all' from the selection
      const newSelection = selectedPlatforms.includes(platformId)
        ? selectedPlatforms.filter(p => p !== platformId)
        : [...selectedPlatforms.filter(p => p !== 'all'), platformId];

      // If no platforms are selected, default to 'all'
      setSelectedPlatforms(newSelection.length > 0 ? newSelection : ['all']);
    }
  };

  // Import the useSupabaseMuteRules hook
  const { addMuteRule } = useSupabaseMuteRules();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");

    // Validate form
    if (keywords.length === 0) {
      console.log("Validation error: No keywords");
      toast({
        title: 'Validation Error',
        description: 'Please add at least one keyword to mute.',
        variant: 'destructive',
      });
      return;
    }

    console.log("Setting isSubmitting to true");
    setIsSubmitting(true);

    try {
      // Prepare the mute rule data
      const muteRule = {
        keywords,
        platforms: selectedPlatforms,
        start_time: Date.now(),
        duration_ms: duration,
        use_regex: useRegex,
        case_sensitive: caseSensitive,
        match_whole_word: matchWholeWord,
      };

      console.log("Prepared mute rule data:", muteRule);

      // Use the hook to add the rule
      console.log("Calling addMuteRule...");
      const result = await addMuteRule(muteRule);
      console.log("addMuteRule completed successfully:", result);

      // Show success message
      toast({
        title: 'Success',
        description: 'Mute rule created successfully!',
      });

      // Redirect to the dashboard
      router.push('/dashboard');
      router.refresh();

    } catch (error) {
      console.error('Error creating mute rule:', error);

      // Extract more detailed error information if available
      let errorMessage = 'Failed to create mute rule';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        // If it's a Supabase error, it might have additional details
        if ('details' in error) {
          console.error('Supabase error details:', error);
          // @ts-ignore - Supabase error might have details property
          if (error.details) errorMessage += `: ${error.details}`;
          // @ts-ignore - Supabase error might have hint property
          if (error.hint) errorMessage += ` (${error.hint})`;
        }
      } else {
        console.error('Non-Error object thrown:', typeof error, error);
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      console.log("Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Mute Rule</CardTitle>
        <CardDescription>
          Add keywords or phrases you want to mute across your selected platforms.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Keywords Section */}
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords to Mute</Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                placeholder="Enter a keyword or phrase"
                value={currentKeyword}
                onChange={(e) => setCurrentKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
              />
              <Button type="button" onClick={addKeyword}>Add</Button>
            </div>

            {/* Keywords List */}
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.length > 0 ? (
                keywords.map((keyword) => (
                  <Badge key={keyword} className="flex items-center gap-1 px-3 py-1">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 rounded-full hover:bg-primary/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No keywords added yet</p>
              )}
            </div>
          </div>

          {/* Platforms Section */}
          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {PLATFORMS.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`platform-${platform.id}`}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => togglePlatform(platform.id)}
                  />
                  <Label htmlFor={`platform-${platform.id}`} className="cursor-pointer">
                    {platform.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Duration Section */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={duration.toString()}
              onValueChange={(value) => setDuration(Number(value))}
            >
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((option) => (
                  <SelectItem key={option.id} value={option.value.toString()}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Options */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="basic">
              <p className="text-sm text-muted-foreground py-2">
                Basic mode uses simple keyword matching.
              </p>
            </TabsContent>
            <TabsContent value="advanced" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="regex">Use Regular Expressions</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable regex pattern matching for more complex filters
                  </p>
                </div>
                <Switch
                  id="regex"
                  checked={useRegex}
                  onCheckedChange={setUseRegex}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="case-sensitive">Case Sensitive</Label>
                  <p className="text-xs text-muted-foreground">
                    Match exact case of letters (e.g., "NBA" won't match "nba")
                  </p>
                </div>
                <Switch
                  id="case-sensitive"
                  checked={caseSensitive}
                  onCheckedChange={setCaseSensitive}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="whole-word">Match Whole Word</Label>
                  <p className="text-xs text-muted-foreground">
                    Only match complete words (e.g., "cat" won't match "category")
                  </p>
                </div>
                <Switch
                  id="whole-word"
                  checked={matchWholeWord}
                  onCheckedChange={setMatchWholeWord}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Mute Rule'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
