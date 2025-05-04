"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { useSupabaseAuth } from "@/contexts/supabase-auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user && !pathname.startsWith("/login") && !pathname.startsWith("/signup")) {
      router.push("/login");
    }
  }, [user, loading, router, pathname]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
