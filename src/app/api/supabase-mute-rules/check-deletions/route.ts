import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Variable to store ID mappings between client and server
let clientToServerIdMap: Map<string, string> | null = null;

/**
 * Special endpoint to check for rules deleted in the web app
 * This is used by the extension to ensure it doesn't re-add rules that were deleted in the web app
 */
export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/supabase-mute-rules/check-deletions: Received request');

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

    // Create a Supabase client with service role key for database operations
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    // Get client rule IDs from query parameters
    const clientRuleIds = req.nextUrl.searchParams.get('ids');
    const clientIds = clientRuleIds ? clientRuleIds.split(',') : [];

    console.log('Client rule IDs:', clientIds);

    // Get user's mute rules from Supabase
    const { data: serverRules, error } = await supabaseAdmin
      .from('mute_rules')
      .select('id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching mute rules:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    console.log('Server rules count:', serverRules?.length || 0);

    // Create a set of server rule IDs for quick lookup
    const serverRuleIds = new Set((serverRules || []).map(rule => rule.id));

    // Find client rules that don't exist on the server (deleted in web app)
    const deletedRuleIds = clientIds.filter(id => !serverRuleIds.has(id));

    console.log('Deleted rule IDs:', deletedRuleIds);

    // Return the deleted rule IDs
    return NextResponse.json({
      success: true,
      deletedRuleIds
    });
  } catch (error) {
    console.error('Unexpected error in check-deletions endpoint:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
