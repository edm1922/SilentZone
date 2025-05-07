"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FilterProfileList } from "@/components/filter-profile-list";
import { FilterProfileForm } from "@/components/filter-profile-form";

export default function ProfilesPage() {
  const [activeTab, setActiveTab] = React.useState<string>("my-profiles");
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const [editingProfileId, setEditingProfileId] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateProfile = () => {
    setIsCreating(true);
    setActiveTab("create");
  };

  const handleEditProfile = (profileId: string) => {
    if (profileId === "new") {
      // Handle "Create Your First Profile" button click
      handleCreateProfile();
    } else {
      setEditingProfileId(profileId);
      setIsEditing(true);
      setActiveTab("edit");
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setActiveTab("my-profiles");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingProfileId(null);
    setActiveTab("my-profiles");
  };

  const handleProfileCreated = () => {
    setIsCreating(false);
    setActiveTab("my-profiles");
    toast({
      title: "Profile Created",
      description: "Your filter profile has been created successfully.",
    });
  };

  const handleProfileUpdated = () => {
    setIsEditing(false);
    setEditingProfileId(null);
    setActiveTab("my-profiles");
    toast({
      title: "Profile Updated",
      description: "Your filter profile has been updated successfully.",
    });
  };

  return (
    <div className="container max-w-4xl py-10">
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Filter Profiles</CardTitle>
              <CardDescription>
                Create and manage different filtering profiles for various contexts
              </CardDescription>
            </div>
            {activeTab === "my-profiles" && (
              <Button onClick={handleCreateProfile}>
                <Plus className="mr-2 h-4 w-4" />
                New Profile
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="my-profiles">My Profiles</TabsTrigger>
              {isCreating && <TabsTrigger value="create">Create Profile</TabsTrigger>}
              {isEditing && <TabsTrigger value="edit">Edit Profile</TabsTrigger>}
            </TabsList>

            <TabsContent value="my-profiles">
              <FilterProfileList onEditProfile={handleEditProfile} />
            </TabsContent>

            <TabsContent value="create">
              <FilterProfileForm
                onCancel={handleCancelCreate}
                onSuccess={handleProfileCreated}
              />
            </TabsContent>

            <TabsContent value="edit">
              {editingProfileId && (
                <FilterProfileForm
                  profileId={editingProfileId}
                  onCancel={handleCancelEdit}
                  onSuccess={handleProfileUpdated}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
