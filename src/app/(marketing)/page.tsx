"use client";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { useSupabaseAuth } from "@/contexts/supabase-auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, ShieldCheck, Globe, Clock, Zap } from "lucide-react";

export default function HomePage() {
  const { user } = useSupabaseAuth();
  const router = useRouter();

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Filter the web, your way
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    SilentZone helps you mute unwanted content across platforms.
                    Avoid spoilers, stay focused, and browse with peace of mind.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" onClick={() => router.push("/signup")}>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => router.push("/login")}>
                    Sign In
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-[350px] rounded-full bg-muted p-4">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <ShieldCheck className="h-24 w-24 text-primary" />
                  </div>
                  <div className="absolute left-[10%] top-[20%] rounded-lg bg-background p-4 shadow-lg">
                    <Globe className="h-8 w-8 text-primary" />
                    <p className="mt-2 text-sm font-medium">Cross-platform filtering</p>
                  </div>
                  <div className="absolute right-[10%] top-[30%] rounded-lg bg-background p-4 shadow-lg">
                    <Clock className="h-8 w-8 text-primary" />
                    <p className="mt-2 text-sm font-medium">Temporary muting</p>
                  </div>
                  <div className="absolute bottom-[20%] left-[30%] rounded-lg bg-background p-4 shadow-lg">
                    <Zap className="h-8 w-8 text-primary" />
                    <p className="mt-2 text-sm font-medium">AI-powered detection</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  How It Works
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  SilentZone makes it easy to filter out unwanted content across the web
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
                <div className="rounded-full bg-background p-4">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">1. Create Mute Rules</h3>
                <p className="text-center text-muted-foreground">
                  Specify keywords, topics, or phrases you want to avoid
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
                <div className="rounded-full bg-background p-4">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">2. Choose Platforms</h3>
                <p className="text-center text-muted-foreground">
                  Apply filters to specific platforms or across the entire web
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
                <div className="rounded-full bg-background p-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">3. Set Duration</h3>
                <p className="text-center text-muted-foreground">
                  Choose how long you want to mute content - from hours to weeks
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SilentZone. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
