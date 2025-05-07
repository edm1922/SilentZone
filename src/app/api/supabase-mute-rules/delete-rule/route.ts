import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * API endpoint for deleting a specific mute rule
 * This is a dedicated endpoint for rule deletion to ensure it works reliably
 */
export async function DELETE(req: NextRequest) {
  try {
    console.log('DELETE /api/supabase-mute-rules/delete-rule: Received request');

    // Get the rule ID from the URL
    const searchParams = req.nextUrl.searchParams;
    const ruleId = searchParams.get('id');

    if (!ruleId) {
      console.error('No rule ID provided');
      return NextResponse.json(
        { error: 'Bad Request', message: 'Rule ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting rule with ID:', ruleId);

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

    // First, check if the rule exists and belongs to the user
    const { data: existingRule, error: checkError } = await supabaseAdmin
      .from('mute_rules')
      .select('id')
      .eq('id', ruleId)
      .eq('user_id', user.id)
      .single();

    if (checkError) {
      console.error('Error checking if rule exists:', checkError);
      return NextResponse.json(
        { error: 'Database error', message: checkError.message },
        { status: 500 }
      );
    }

    if (!existingRule) {
      console.log('Rule not found or does not belong to user');
      return NextResponse.json(
        { error: 'Not Found', message: 'Rule not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Delete the rule
    const { error: deleteError } = await supabaseAdmin
      .from('mute_rules')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting rule:', deleteError);
      return NextResponse.json(
        { error: 'Database error', message: deleteError.message },
        { status: 500 }
      );
    }

    console.log('Rule deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in delete rule endpoint:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
