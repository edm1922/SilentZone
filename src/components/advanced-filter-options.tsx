"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvancedFilterOptionsProps {
  useRegex: boolean;
  onUseRegexChange: (value: boolean) => void;
  caseSensitive: boolean;
  onCaseSensitiveChange: (value: boolean) => void;
  matchWholeWord: boolean;
  onMatchWholeWordChange: (value: boolean) => void;
  className?: string;
}

export function AdvancedFilterOptions({
  useRegex,
  onUseRegexChange,
  caseSensitive,
  onCaseSensitiveChange,
  matchWholeWord,
  onMatchWholeWordChange,
  className,
}: AdvancedFilterOptionsProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center text-xs text-muted-foreground hover:text-foreground w-full justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <Settings className="h-3 w-3 mr-1" />
          <span>Advanced Filtering Options</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </Button>

      {isExpanded && (
        <div className="space-y-3 p-3 rounded-md border border-dashed border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="use-regex" className="text-sm">
                Use Regular Expressions
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable pattern matching with regex
              </p>
            </div>
            <Switch
              id="use-regex"
              checked={useRegex}
              onCheckedChange={onUseRegexChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="case-sensitive" className="text-sm">
                Case Sensitive
              </Label>
              <p className="text-xs text-muted-foreground">
                Match exact letter case
              </p>
            </div>
            <Switch
              id="case-sensitive"
              checked={caseSensitive}
              onCheckedChange={onCaseSensitiveChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="whole-word" className="text-sm">
                Match Whole Words
              </Label>
              <p className="text-xs text-muted-foreground">
                Avoid partial word matches
              </p>
            </div>
            <Switch
              id="whole-word"
              checked={matchWholeWord}
              onCheckedChange={onMatchWholeWordChange}
            />
          </div>

          {useRegex && (
            <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
              <p>
                <strong>Regex Examples:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>
                  <code>spoiler|leak</code> - Match "spoiler" or "leak"
                </li>
                <li>
                  <code>game.*thrones</code> - Match "game" followed by "thrones"
                </li>
                <li>
                  <code>\b(nba|basketball)\b</code> - Match whole words "nba" or
                  "basketball"
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
