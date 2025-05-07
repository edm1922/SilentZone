import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Use the edge runtime to avoid cookie issues
export const runtime = 'edge';

/**
 * Debug endpoint for creating a test rule
 */
export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/create-test-rule: Received request');

    // Create a direct Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the user ID from the query parameter
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    console.log('Creating test rule for user ID:', userId);

    // Create a test rule
    const { data, error } = await supabase
      .from('mute_rules')
      .insert([
        {
          user_id: userId,
          keywords: ['test-keyword'],
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
      console.error('Error creating test rule:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    console.log('Created test rule:', data);

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Test rule created successfully',
      rule: data
    });
  } catch (error) {
    console.error('Unexpected error in create-test-rule endpoint:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
