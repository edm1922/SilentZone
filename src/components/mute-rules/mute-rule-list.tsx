"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, RefreshCw, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useSupabaseMuteRules } from '@/hooks/use-supabase-mute-rules';

export default function MuteRuleList() {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  // Use the Supabase mute rules hook
  const {
    muteRules,
    isLoading: loading,
    error,
    deleteMuteRule: deleteRule
  } = useSupabaseMuteRules();

  // Delete a mute rule
  const handleDeleteMuteRule = async (id: string) => {
    setDeleting(id);
    try {
      await deleteRule(id);

      toast({
        title: 'Success',
        description: 'Mute rule deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting mute rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete mute rule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  // Format duration for display
  const formatDuration = (durationMs: number | undefined): string => {
    // Handle invalid values
    if (durationMs === undefined || isNaN(durationMs)) return 'Unknown';
    if (durationMs < 0) return 'Permanent';

    try {
      const seconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 30) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''}`;
      if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    } catch (error) {
      console.error('Error formatting duration:', error);
      return 'Unknown';
    }
  };

  // Check if a rule is active
  const isRuleActive = (rule: any): boolean => {
    // Handle invalid values
    if (!rule || rule.duration_ms === undefined || rule.start_time === undefined) {
      return false;
    }

    try {
      if (rule.duration_ms < 0) return true; // Permanent rule
      return Date.now() < rule.start_time + rule.duration_ms;
    } catch (error) {
      console.error('Error checking if rule is active:', error);
      return false;
    }
  };

  // Calculate time remaining
  const getTimeRemaining = (rule: any): string => {
    // Handle invalid values
    if (!rule || rule.duration_ms === undefined || rule.start_time === undefined) {
      return 'Unknown';
    }

    try {
      if (rule.duration_ms < 0) return 'Permanent';

      const endTime = rule.start_time + rule.duration_ms;
      const remainingMs = endTime - Date.now();

      if (remainingMs <= 0) return 'Expired';

      const seconds = Math.floor(remainingMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 30) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''} left`;
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} left`;
      return `${seconds} second${seconds !== 1 ? 's' : ''} left`;
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      return 'Unknown';
    }
  };

  // Format platforms for display
  const formatPlatforms = (platforms: any): string => {
    // Handle invalid values
    if (!platforms || !Array.isArray(platforms)) {
      return 'All Platforms';
    }

    try {
      if (platforms.includes('all')) return 'All Platforms';

      // Map platform IDs to names
      const platformMap: Record<string, string> = {
        twitter: 'Twitter/X',
        facebook: 'Facebook',
        instagram: 'Instagram',
        reddit: 'Reddit',
        youtube: 'YouTube',
        linkedin: 'LinkedIn',
        news: 'News Sites',
      };

      return platforms.map(p => platformMap[p] || p).join(', ');
    } catch (error) {
      console.error('Error formatting platforms:', error);
      return 'All Platforms';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Mute Rules</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => router.push('/mute-rules/create')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {error.message || "There was an error loading mute rules."}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        // Loading skeleton
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : muteRules.length === 0 ? (
        // Empty state
        <Card className="w-full">
          <CardHeader>
            <CardTitle>No Mute Rules Found</CardTitle>
            <CardDescription>
              You haven't created any mute rules yet. Create your first rule to start filtering content.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/mute-rules/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Mute Rule
            </Button>
          </CardFooter>
        </Card>
      ) : (
        // Mute rules list
        <div className="space-y-4">
          {muteRules.map((rule) => (
            <Card key={rule.id} className={`w-full ${!isRuleActive(rule) ? 'opacity-70' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {rule.keywords.join(', ')}
                      {!isRuleActive(rule) && (
                        <Badge variant="outline" className="ml-2">Expired</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {formatPlatforms(rule.platforms)}
                    </CardDescription>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Mute Rule</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this mute rule? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteMuteRule(rule.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting === rule.id ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {rule.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    Duration: {formatDuration(rule.duration_ms)} • {getTimeRemaining(rule)}
                  </span>
                </div>
                {(rule.use_regex || rule.case_sensitive || rule.match_whole_word) && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Advanced options: </span>
                    {rule.use_regex && <Badge variant="outline" className="mr-1">Regex</Badge>}
                    {rule.case_sensitive && <Badge variant="outline" className="mr-1">Case Sensitive</Badge>}
                    {rule.match_whole_word && <Badge variant="outline">Whole Word</Badge>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
