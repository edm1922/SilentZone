"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/contexts/supabase-auth-context";

export function MainNav() {
  const pathname = usePathname();
  const { user, logout } = useSupabaseAuth();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      requiresAuth: true,
    },
    {
      name: "Create Rule",
      href: "/create",
      requiresAuth: true,
    },
    {
      name: "Profiles",
      href: "/profiles",
      requiresAuth: true,
    },
    {
      name: "Analytics",
      href: "/analytics",
      requiresAuth: true,
    },
    {
      name: "Profile",
      href: "/profile",
      requiresAuth: true,
    },
  ];

  // Filter nav items based on auth status
  const filteredNavItems = navItems.filter(
    (item) => !item.requiresAuth || (item.requiresAuth && user)
  );

  return (
    <div className="mr-4 flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <span className="font-bold text-xl">SilentZone</span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === item.href
                ? "text-foreground font-semibold"
                : "text-foreground/60"
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
