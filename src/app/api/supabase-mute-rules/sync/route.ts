import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Use the edge runtime to avoid cookie issues
export const runtime = 'edge';

/**
 * API endpoint for syncing mute rules with the browser extension
 */
export async function PUT(req: NextRequest) {
  try {
    console.log('PUT /api/supabase-mute-rules/sync: Received request');

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

    // Create a direct Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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

    // Parse request body
    const body = await req.json();
    const { clientRules } = body;

    if (!clientRules || !Array.isArray(clientRules)) {
      console.error('Invalid clientRules:', clientRules);
      return NextResponse.json(
        { error: 'Invalid request', message: 'clientRules must be an array' },
        { status: 400 }
      );
    }

    console.log('Client rules received:', clientRules.length);

    // Get user's mute rules from Supabase
    console.log('Fetching mute rules for user:', user.id, user.email);

    const { data: muteRules, error } = await supabase
      .from('mute_rules')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching mute rules:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    console.log('Found mute rules:', muteRules?.length || 0, 'rules');

    if (muteRules && muteRules.length > 0) {
      console.log('Sample rule:', JSON.stringify(muteRules[0]));
    }

    // Format rules for the extension
    const formattedRules = muteRules.map(rule => ({
      id: rule.id,
      keywords: rule.keywords,
      platforms: rule.platforms,
      startTime: rule.start_time,
      durationMs: rule.duration_ms,
      useRegex: rule.use_regex,
      caseSensitive: rule.case_sensitive,
      matchWholeWord: rule.match_whole_word
    }));

    console.log('Formatted rules:', formattedRules.length);

    // Return the rules
    return NextResponse.json({
      success: true,
      serverRules: formattedRules
    });
  } catch (error) {
    console.error('Unexpected error in extension sync endpoint:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving mute rules
 */
export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/supabase-mute-rules/sync: Received request');

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

    // Create a direct Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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

    // Get user's mute rules from Supabase
    console.log('Fetching mute rules for user:', user.id, user.email);

    const { data: muteRules, error } = await supabase
      .from('mute_rules')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching mute rules:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    console.log('Found mute rules:', muteRules?.length || 0, 'rules');

    if (muteRules && muteRules.length > 0) {
      console.log('Sample rule:', JSON.stringify(muteRules[0]));
    }

    // Format rules for the extension
    const formattedRules = muteRules.map(rule => ({
      id: rule.id,
      keywords: rule.keywords,
      platforms: rule.platforms,
      startTime: rule.start_time,
      durationMs: rule.duration_ms,
      useRegex: rule.use_regex,
      caseSensitive: rule.case_sensitive,
      matchWholeWord: rule.match_whole_word
    }));

    console.log('Formatted rules:', formattedRules.length);

    // Return the rules
    return NextResponse.json({
      success: true,
      serverRules: formattedRules
    });
  } catch (error) {
    console.error('Unexpected error in extension sync endpoint:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
