"use client";

import { useSupabaseMuteRules } from "@/hooks/use-supabase-mute-rules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SupabaseMuteRuleList() {
  const { muteRules, isLoading, error, isUsingLocalStorage, deleteMuteRule } = useSupabaseMuteRules();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const handleEditRule = (ruleId: string) => {
    router.push(`/edit/${ruleId}`);
  };

  const handleDeleteClick = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (ruleToDelete) {
      await deleteMuteRule(ruleToDelete);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.round(hours)} hours`;
    const days = hours / 24;
    return `${Math.round(days)} days`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-20 mr-2" />
              <Skeleton className="h-10 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message}
          {isUsingLocalStorage && " Using local storage instead."}
        </AlertDescription>
      </Alert>
    );
  }

  if (muteRules.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No mute rules found</CardTitle>
          <CardDescription>
            Create your first mute rule to start filtering content
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/create")}>Create Mute Rule</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {isUsingLocalStorage && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Using local storage</AlertTitle>
            <AlertDescription>
              Unable to connect to Supabase. Your rules are stored locally and will sync when connection is restored.
            </AlertDescription>
          </Alert>
        )}

        {muteRules.map((rule) => (
          <Card key={rule.id} className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {rule.keywords.join(", ")}
              </CardTitle>
              <CardDescription className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {rule.duration_ms === 0
                  ? "Permanent"
                  : formatDuration(rule.duration_ms)}
                {rule.duration_ms > 0 && rule.start_time && (
                  <span className="ml-1">
                    (expires {formatDistanceToNow(rule.start_time + rule.duration_ms, { addSuffix: true })})
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-2">
                {rule.platforms.map((platform) => (
                  <Badge key={platform.id} variant="outline">
                    {platform.name}
                  </Badge>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                Created {formatDistanceToNow(new Date(rule.created_at), { addSuffix: true })}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="outline"
                size="sm"
                className="mr-2"
                onClick={() => handleEditRule(rule.id)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteClick(rule.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this mute rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
