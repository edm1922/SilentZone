import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Use the edge runtime to avoid cookie issues
export const runtime = 'edge';

/**
 * Debug endpoint for creating a rule for a specific user
 */
export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/create-rule-for-user: Received request');

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

    // Create a direct Supabase client with service role key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    console.log('Using service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Verify token by getting the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Invalid token or user not found:', userError);
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid token' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.email);
    console.log('User ID:', user.id);

    // Create a rule for this user
    const { data, error } = await supabase
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
    console.error('Unexpected error in create-rule-for-user endpoint:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
