"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupabaseMutedContentCard } from "@/components/supabase-muted-content-card";
import { Loader2, Plus, Shield, RefreshCw } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useSupabaseMuteRules } from "@/hooks/use-supabase-mute-rules";
import { useSupabaseAuth } from "@/contexts/supabase-auth-context";
import { ExtensionAuthHandler } from "@/components/extension-auth-handler";

export default function DashboardPage() {
  const { user } = useSupabaseAuth();
  const {
    muteRules,
    isLoading: isLoadingRules,
    error,
    isUsingLocalStorage,
    deleteMuteRule
  } = useSupabaseMuteRules();

  console.log("Dashboard rendering with:", {
    user: user?.id,
    rulesCount: muteRules?.length || 0,
    isLoading: isLoadingRules,
    isUsingLocalStorage,
    error: error?.message
  });

  // Helper function to check if a rule is expired
  function isRuleExpired(rule: any) {
    if (!rule || typeof rule.startTime !== 'number' || typeof rule.durationMs !== 'number') {
      console.error("Invalid rule data for expiry check:", rule);
      return false; // Default to not expired if data is invalid
    }

    const now = Date.now();
    const expiryTime = rule.startTime + rule.durationMs;
    const isExpired = now > expiryTime;

    console.log(
      "Rule expiry check:",
      rule.id,
      "keywords:", rule.keywords?.join(',') || 'none',
      "startTime:", new Date(rule.startTime).toLocaleString(),
      "duration:", rule.durationMs / (1000 * 60 * 60 * 24) + " days",
      "expiryTime:", new Date(expiryTime).toLocaleString(),
      "now:", new Date(now).toLocaleString(),
      "isExpired:", isExpired
    );

    return isExpired;
  }

  return (
    <div className="container max-w-7xl py-10">
      {/* This component handles extension authentication */}
      <ExtensionAuthHandler />

      {isUsingLocalStorage && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <div>
                <p className="text-sm text-yellow-700 font-medium mb-1">
                  <strong>Offline Mode:</strong> You're viewing locally stored rules.
                </p>
                <p className="text-xs text-yellow-600">
                  Your changes are saved locally and will automatically sync when connection is restored.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Only show error if it's not a connection timeout (which is handled by the offline mode banner) */}
      {error && !error.message?.includes("Connection to Supabase timed out") && !error.message?.includes("Failed to connect to Supabase") && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {error.message || "There was an error connecting to the server."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.user_metadata?.full_name || user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/create">
              <Plus className="mr-2 h-4 w-4" />
              New Mute Rule
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {isLoadingRules ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading mute rules...</span>
            </div>
          ) : muteRules.filter(rule => !isRuleExpired(rule)).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(() => {
                console.log("Rendering active rules section");
                const activeRules = muteRules.filter(rule => !isRuleExpired(rule));
                console.log("Active rules count:", activeRules.length);

                return activeRules.map(rule => {
                  console.log("Rendering rule card:", rule.id, rule.keywords);
                  return (
                    <SupabaseMutedContentCard
                      key={rule.id}
                      id={rule.id}
                      keywords={rule.keywords}
                      platforms={rule.platforms}
                      start_time={rule.startTime}
                      duration_ms={rule.durationMs}
                      use_regex={rule.useRegex}
                      case_sensitive={rule.caseSensitive}
                      match_whole_word={rule.matchWholeWord}
                      onRemove={() => deleteMuteRule(rule.id)}
                    />
                  );
                });
              })()}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No active mute rules</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  You don't have any active mute rules. Create a new rule to start filtering content.
                </p>
                <Button asChild>
                  <Link href="/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Mute Rule
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Scheduled mute rules coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          {isLoadingRules ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading mute rules...</span>
            </div>
          ) : muteRules.filter(rule => isRuleExpired(rule)).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {muteRules
                .filter(rule => isRuleExpired(rule))
                .map(rule => (
                  <SupabaseMutedContentCard
                    key={rule.id}
                    id={rule.id}
                    keywords={rule.keywords}
                    platforms={rule.platforms}
                    start_time={rule.startTime}
                    duration_ms={rule.durationMs}
                    use_regex={rule.useRegex}
                    case_sensitive={rule.caseSensitive}
                    match_whole_word={rule.matchWholeWord}
                    onRemove={() => deleteMuteRule(rule.id)}
                  />
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No expired mute rules</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
