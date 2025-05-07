
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeywordInputProps {
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  className?: string;
}

export function KeywordInput({ keywords, onKeywordsChange, className }: KeywordInputProps) {
  const [inputValue, setInputValue] = React.useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleAddKeyword = () => {
    const newKeyword = inputValue.trim();
    if (newKeyword && !keywords.includes(newKeyword)) {
      // Create a new array to avoid reference issues
      const updatedKeywords = [...keywords, newKeyword];
      console.log("Adding keyword:", newKeyword, "Updated keywords:", updatedKeywords);
      onKeywordsChange(updatedKeywords);
      setInputValue("");
    } else if (newKeyword && keywords.includes(newKeyword)) {
      console.log("Keyword already exists:", newKeyword);
    } else if (!newKeyword) {
      console.log("Empty keyword, not adding");
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    onKeywordsChange(keywords.filter((keyword) => keyword !== keywordToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      console.log("Key pressed:", e.key);
      handleAddKeyword();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Add keywords or topics (e.g., NBA, Game of Thrones)"
          className="flex-grow"
        />
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleAddKeyword();
          }}
          size="icon"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add Keyword</span>
        </Button>
      </div>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <Badge
              key={keyword}
              variant="secondary"
              className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {keyword}
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                onClick={() => handleRemoveKeyword(keyword)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {keyword}</span>
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
