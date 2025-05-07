import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Use the edge runtime to avoid cookie issues
export const runtime = 'edge';

/**
 * Debug endpoint for checking mute rules
 */
export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/debug-rules: Received request');

    // Create a direct Supabase client with service role key if available
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

    // Get all rules (limited to 20)
    const { data: allRules, error: allRulesError } = await supabase
      .from('mute_rules')
      .select('*')
      .limit(20);

    if (allRulesError) {
      console.error('Error fetching all rules:', allRulesError);
      return NextResponse.json(
        { error: 'Database error', message: allRulesError.message },
        { status: 500 }
      );
    }

    console.log('All rules in database (up to 20):', JSON.stringify(allRules));

    // Return the rules
    return NextResponse.json({
      success: true,
      rules: allRules,
      count: allRules.length
    });
  } catch (error) {
    console.error('Unexpected error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
