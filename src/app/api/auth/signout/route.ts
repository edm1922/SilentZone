import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookies().get(name)?.value,
        set: (name, value, options) => cookies().set(name, value, options),
        remove: (name, options) => cookies().set(name, '', { ...options, maxAge: 0 }),
      },
    }
  );

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to the login page
  return NextResponse.redirect(new URL('/login', request.url));
}
