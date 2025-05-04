"use client";

import { UserProfile } from "@/components/auth/user-profile";

export default function ProfilePage() {
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      <UserProfile />
    </div>
  );
}
