import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Use the edge runtime to avoid cookie issues
export const runtime = 'edge';

/**
 * POST /api/auth/extension-login
 * Direct login endpoint for the browser extension
 */
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/auth/extension-login: Received request');

    // Get email and password from request body
    const { email, password, sessionId } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Attempting to login with email:', email);

    // Create a Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        { error: 'Authentication failed', message: 'No session or user returned' },
        { status: 401 }
      );
    }

    console.log('User authenticated successfully:', data.user.email);

    // Create response data with refresh token and expiration
    const responseData: any = {
      success: true,
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };

    // Include the session ID if available
    if (sessionId) {
      responseData.sessionId = sessionId;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in POST /api/auth/extension-login:', error);
    return NextResponse.json(
      { error: 'Server error', message: String(error) },
      { status: 500 }
    );
  }
}
