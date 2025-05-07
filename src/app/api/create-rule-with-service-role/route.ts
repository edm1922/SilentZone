import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Use the edge runtime to avoid cookie issues
export const runtime = 'edge';

// Service role key (stored here for testing purposes only - should be in environment variables)
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcGZ3dGlhdnpuZGRrYmhtcm53Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMzNDU3MywiZXhwIjoyMDYxOTEwNTczfQ.7hR25cT9Wpg-b3PvYAlP9r9bcn_QO12e9r65JHmxjoY';

/**
 * Debug endpoint for creating a rule for a specific user using service role
 */
export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/create-rule-with-service-role: Received request');

    // Check for Bearer token in Authorization header
    const authHeader = req.headers.get('Authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract token
      token = authHeader.substring(7);
      console.log('Token found in Authorization header');
    } else {
      console.log('No token found in Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing authorization token' },
        { status: 401 }
      );
    }

    // Create a regular Supabase client to get the user
    const regularClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify token by getting the user
    const { data: { user }, error: userError } = await regularClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Invalid token or user not found:', userError);
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid token' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.email);
    console.log('User ID:', user.id);

    // Create a Supabase client with service role key
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    console.log('Using service role key for database operations');

    // Create a rule for this user using the admin client
    const { data, error } = await supabaseAdmin
      .from('mute_rules')
      .insert([
        {
          user_id: user.id,
          keywords: ['test-from-extension'],
          platforms: ['all'],
          start_time: new Date().getTime(),
          duration_ms: 7 * 24 * 60 * 60 * 1000, // 7 days
          use_regex: false,
          case_sensitive: false,
          match_whole_word: false
        }
      ])
      .select();

    if (error) {
      console.error('Error creating rule:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    console.log('Created rule:', data);

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Rule created successfully',
      rule: data
    });
  } catch (error) {
    console.error('Unexpected error in create-rule-with-service-role endpoint:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
