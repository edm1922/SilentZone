"use client";

import { useSupabaseAuth } from "@/contexts/supabase-auth-context";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import {
  getMuteRulesFromLocalStorage,
  saveMuteRulesToLocalStorage,
  addMuteRuleToLocalStorage,
  removeMuteRuleFromLocalStorage,
  generateLocalRuleId
} from "@/lib/local-storage";

export interface MuteRule {
  id: string;
  user_id: string;
  keywords: string[];
  platforms: { id: string; name: string }[];
  start_time: number;
  duration_ms: number;
  use_regex?: boolean;
  case_sensitive?: boolean;
  match_whole_word?: boolean;
  created_at: string;
  updated_at: string;
}

export function useSupabaseMuteRules() {
  const { user } = useSupabaseAuth();
  const [muteRules, setMuteRules] = useState<MuteRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);

  // Load mute rules when user changes
  useEffect(() => {
    if (!user) {
      setMuteRules([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Try to sync local rules to Supabase if we have a user
    const syncLocalRulesToSupabase = async () => {
      // Get local rules for this user
      const localRules = getMuteRulesFromLocalStorage(user.id);
      
      // Filter out rules that don't have a Supabase ID (those are local-only)
      const localOnlyRules = localRules.filter(rule => !rule.id.startsWith('supabase-'));
      
      console.log(`Found ${localOnlyRules.length} local-only rules to sync`);
      
      // Try to sync each local rule to Supabase
      for (const localRule of localOnlyRules) {
        try {
          console.log(`Syncing local rule ${localRule.id} to Supabase`);

          // Create a clean version without the local ID
          const { id, ...ruleData } = localRule;

          // Convert to Supabase format (snake_case)
          const supabaseRule = {
            user_id: user.id,
            keywords: ruleData.keywords,
            platforms: ruleData.platforms,
            start_time: ruleData.startTime,
            duration_ms: ruleData.durationMs,
            use_regex: ruleData.useRegex,
            case_sensitive: ruleData.caseSensitive,
            match_whole_word: ruleData.matchWholeWord,
          };

          // Add to Supabase
          const { data, error } = await supabase
            .from('mute_rules')
            .insert(supabaseRule)
            .select()
            .single();

          if (error) throw error;

          console.log(`Successfully synced rule to Supabase with ID: ${data.id}`);

          // Create the Supabase version of the rule
          const syncedRule = {
            id: `supabase-${data.id}`,
            userId: user.id,
            keywords: data.keywords,
            platforms: data.platforms,
            startTime: data.start_time,
            durationMs: data.duration_ms,
            useRegex: data.use_regex,
            caseSensitive: data.case_sensitive,
            matchWholeWord: data.match_whole_word,
            createdAt: new Date(data.created_at).getTime(),
            updatedAt: new Date(data.updated_at).getTime(),
          };

          // Remove the local rule
          removeMuteRuleFromLocalStorage(user.id, localRule.id);

          // Add the Supabase rule
          addMuteRuleToLocalStorage(syncedRule);
        } catch (error) {
          console.error(`Error syncing rule to Supabase:`, error);
        }
      }
    };

    // Fetch rules from Supabase
    const fetchRules = async () => {
      try {
        // First try to sync any local rules
        await syncLocalRulesToSupabase();

        // Then fetch all rules from Supabase
        const { data, error } = await supabase
          .from('mute_rules')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Convert from Supabase format to app format
        const formattedRules = data.map(rule => ({
          id: `supabase-${rule.id}`,
          userId: rule.user_id,
          keywords: rule.keywords,
          platforms: rule.platforms,
          startTime: rule.start_time,
          durationMs: rule.duration_ms,
          useRegex: rule.use_regex,
          caseSensitive: rule.case_sensitive,
          matchWholeWord: rule.match_whole_word,
          createdAt: new Date(rule.created_at).getTime(),
          updatedAt: new Date(rule.updated_at).getTime(),
        }));

        setMuteRules(formattedRules);
        setIsLoading(false);

        // Also update local storage
        saveMuteRulesToLocalStorage(user.id, formattedRules);
      } catch (err) {
        console.error("Error fetching mute rules from Supabase:", err);
        setError(err as Error);
        
        // Fall back to local storage
        const localRules = getMuteRulesFromLocalStorage(user.id);
        setMuteRules(localRules);
        setIsUsingLocalStorage(true);
        
        setIsLoading(false);
      }
    };

    fetchRules();
  }, [user]);

  // Add a new mute rule
  const addMuteRule = async (rule: Omit<MuteRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error("User must be logged in to add mute rules");
    }

    // Convert from app format to Supabase format
    const supabaseRule = {
      user_id: user.id,
      keywords: rule.keywords,
      platforms: rule.platforms,
      start_time: rule.start_time,
      duration_ms: rule.duration_ms,
      use_regex: rule.use_regex,
      case_sensitive: rule.case_sensitive,
      match_whole_word: rule.match_whole_word,
    };

    // Create a local version with a temporary ID in case Supabase fails
    const localRule = {
      id: generateLocalRuleId(),
      userId: user.id,
      keywords: rule.keywords,
      platforms: rule.platforms,
      startTime: rule.start_time,
      durationMs: rule.duration_ms,
      useRegex: rule.use_regex,
      caseSensitive: rule.case_sensitive,
      matchWholeWord: rule.match_whole_word,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add to local storage immediately for optimistic UI update
    addMuteRuleToLocalStorage(localRule);

    // Update the UI immediately with the local rule
    setMuteRules(prevRules => {
      const newRules = [localRule, ...prevRules.filter(r => r.id !== localRule.id)];
      newRules.sort((a, b) => b.createdAt - a.createdAt);
      return newRules;
    });

    try {
      // Add to Supabase
      const { data, error } = await supabase
        .from('mute_rules')
        .insert(supabaseRule)
        .select()
        .single();

      if (error) throw error;

      // Create the Supabase version of the rule
      const createdRule = {
        id: `supabase-${data.id}`,
        userId: data.user_id,
        keywords: data.keywords,
        platforms: data.platforms,
        startTime: data.start_time,
        durationMs: data.duration_ms,
        useRegex: data.use_regex,
        caseSensitive: data.case_sensitive,
        matchWholeWord: data.match_whole_word,
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
      };

      // Remove the local rule
      removeMuteRuleFromLocalStorage(user.id, localRule.id);

      // Add the Supabase rule
      addMuteRuleToLocalStorage(createdRule);

      // Update the UI with the Supabase rule
      setMuteRules(prevRules => {
        const newRules = [
          createdRule,
          ...prevRules.filter(r => r.id !== localRule.id)
        ];
        newRules.sort((a, b) => b.createdAt - a.createdAt);
        return newRules;
      });

      return createdRule;
    } catch (err) {
      console.error("Error adding mute rule to Supabase:", err);
      // We already added to local storage, so just return the local rule
      return localRule;
    }
  };

  // Update a mute rule
  const updateMuteRule = async (id: string, updates: Partial<MuteRule>) => {
    if (!user) {
      throw new Error("User must be logged in to update mute rules");
    }

    // Check if this is a Supabase rule
    const isSupabaseRule = id.startsWith('supabase-');
    const supabaseId = isSupabaseRule ? id.replace('supabase-', '') : null;

    // Update in local storage first for optimistic UI update
    const existingRules = getMuteRulesFromLocalStorage(user.id);
    const ruleIndex = existingRules.findIndex(r => r.id === id);
    
    if (ruleIndex === -1) {
      throw new Error(`Rule with ID ${id} not found`);
    }

    const updatedRule = {
      ...existingRules[ruleIndex],
      ...updates,
      updatedAt: Date.now(),
    };

    existingRules[ruleIndex] = updatedRule;
    saveMuteRulesToLocalStorage(user.id, existingRules);

    // Update the UI immediately
    setMuteRules(prevRules => {
      const newRules = [...prevRules];
      const index = newRules.findIndex(r => r.id === id);
      if (index !== -1) {
        newRules[index] = { ...newRules[index], ...updates, updatedAt: Date.now() };
      }
      return newRules;
    });

    // If this is a Supabase rule, update in Supabase
    if (isSupabaseRule && supabaseId) {
      try {
        // Convert to Supabase format
        const supabaseUpdates: any = {};
        
        if (updates.keywords) supabaseUpdates.keywords = updates.keywords;
        if (updates.platforms) supabaseUpdates.platforms = updates.platforms;
        if (updates.start_time) supabaseUpdates.start_time = updates.start_time;
        if (updates.duration_ms !== undefined) supabaseUpdates.duration_ms = updates.duration_ms;
        if (updates.use_regex !== undefined) supabaseUpdates.use_regex = updates.use_regex;
        if (updates.case_sensitive !== undefined) supabaseUpdates.case_sensitive = updates.case_sensitive;
        if (updates.match_whole_word !== undefined) supabaseUpdates.match_whole_word = updates.match_whole_word;

        const { error } = await supabase
          .from('mute_rules')
          .update(supabaseUpdates)
          .eq('id', supabaseId)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err) {
        console.error("Error updating mute rule in Supabase:", err);
        // We already updated local storage, so just log the error
      }
    }

    return updatedRule;
  };

  // Delete a mute rule
  const deleteMuteRule = async (id: string) => {
    if (!user) {
      throw new Error("User must be logged in to delete mute rules");
    }

    // Check if this is a Supabase rule
    const isSupabaseRule = id.startsWith('supabase-');
    const supabaseId = isSupabaseRule ? id.replace('supabase-', '') : null;

    // Remove from local storage first for optimistic UI update
    removeMuteRuleFromLocalStorage(user.id, id);

    // Update the UI immediately
    setMuteRules(prevRules => prevRules.filter(r => r.id !== id));

    // If this is a Supabase rule, delete from Supabase
    if (isSupabaseRule && supabaseId) {
      try {
        const { error } = await supabase
          .from('mute_rules')
          .delete()
          .eq('id', supabaseId)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err) {
        console.error("Error deleting mute rule from Supabase:", err);
        // We already removed from local storage, so just log the error
      }
    }
  };

  return {
    muteRules,
    isLoading,
    error,
    isUsingLocalStorage,
    addMuteRule,
    updateMuteRule,
    deleteMuteRule,
  };
}
