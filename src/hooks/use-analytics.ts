"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSupabaseAuth } from '@/contexts/supabase-auth-context';

// Simple mock analytics service since we're not using Firebase anymore
const analyticsService = {
  logPageView: (pageName: string, pageClass: string) => {
    console.log(`[Analytics] Page view: ${pageName} (${pageClass})`);
  },
  
  logSignup: (method: string) => {
    console.log(`[Analytics] User signup: ${method}`);
  },
  
  logLogin: (method: string) => {
    console.log(`[Analytics] User login: ${method}`);
  },
  
  logLogout: () => {
    console.log(`[Analytics] User logout`);
  },
  
  logRuleCreated: (rule: any) => {
    console.log(`[Analytics] Rule created:`, rule);
  },
  
  logRuleDeleted: (ruleId: string) => {
    console.log(`[Analytics] Rule deleted: ${ruleId}`);
  },
  
  logRuleUpdated: (rule: any) => {
    console.log(`[Analytics] Rule updated:`, rule);
  },
  
  logCustomEvent: (eventName: string, params: Record<string, any>) => {
    console.log(`[Analytics] Custom event: ${eventName}`, params);
  }
};

export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useSupabaseAuth();

  // Track page views
  useEffect(() => {
    if (pathname) {
      // Get page name from pathname
      const pageName = pathname.split('/').pop() || 'home';

      // Get page class (e.g., 'auth', 'dashboard', etc.)
      const pageClass = pathname.startsWith('/dashboard')
        ? 'dashboard'
        : pathname.startsWith('/profile')
          ? 'profile'
          : pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/reset-password')
            ? 'auth'
            : 'marketing';

      // Log page view
      analyticsService.logPageView(pageName, pageClass);
    }
  }, [pathname, searchParams]);

  return {
    ...analyticsService,
    // Add any additional analytics functionality here
  };
}
