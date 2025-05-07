"use client";

import Link from "next/link";
import { MainNav } from "@/components/layout/main-nav";
import { UserAccountNav } from "@/components/layout/user-account-nav";
import { useSupabaseAuth } from "@/contexts/supabase-auth-context";
import { Loader2 } from "lucide-react";

export function SiteHeader() {
  const { loading } = useSupabaseAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <UserAccountNav />
          )}
        </div>
      </div>
    </header>
  );
}
