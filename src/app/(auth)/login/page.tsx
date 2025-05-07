"use client";

import { SupabaseLoginForm } from "@/components/auth/supabase-login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseAuth } from "@/contexts/supabase-auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ExtensionAuthHandler } from "@/components/extension-auth-handler";

export default function LoginPage() {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExtensionAuth, setIsExtensionAuth] = useState(false);

  // Check if this is an extension auth request
  useEffect(() => {
    const extensionAuth = searchParams.get('extensionAuth');
    if (extensionAuth === 'true') {
      setIsExtensionAuth(true);
      console.log('Extension auth flow detected');
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // If this is an extension auth request, redirect to dashboard with extension auth param
      if (isExtensionAuth) {
        router.push("/dashboard?extensionAuth=true");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router, isExtensionAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      {/* This component handles extension authentication */}
      <ExtensionAuthHandler />

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            {isExtensionAuth
              ? "Sign in to connect your browser extension"
              : "Enter your email and password to access your account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupabaseLoginForm />

          {isExtensionAuth && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
              <p>You're signing in to connect your SilentZone browser extension.</p>
              <p className="mt-1">After signing in, your extension will be automatically connected to your account.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
