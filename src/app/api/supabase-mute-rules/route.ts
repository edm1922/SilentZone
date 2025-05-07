import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

/**
 * GET /api/supabase-mute-rules
 * Returns all mute rules for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get mute rules for the authenticated user
    const { data: muteRules, error } = await supabase
      .from('mute_rules')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mute rules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mute rules' },
        { status: 500 }
      );
    }

    return NextResponse.json({ muteRules });
  } catch (error) {
    console.error('Error in GET /api/supabase-mute-rules:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/supabase-mute-rules
 * Adds a new mute rule for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
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

    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rule = await request.json();

    // Validate the rule
    if (!rule.keywords || !Array.isArray(rule.keywords) || rule.keywords.length === 0) {
      return NextResponse.json(
        { error: 'Invalid rule: keywords are required' },
        { status: 400 }
      );
    }

    if (!rule.platforms || !Array.isArray(rule.platforms) || rule.platforms.length === 0) {
      return NextResponse.json(
        { error: 'Invalid rule: platforms are required' },
        { status: 400 }
      );
    }

    if (rule.duration_ms === undefined || typeof rule.duration_ms !== 'number' || rule.duration_ms < 0) {
      return NextResponse.json(
        { error: 'Invalid rule: duration_ms is required and must be non-negative' },
        { status: 400 }
      );
    }

    // Prepare the rule for insertion
    const newRule = {
      user_id: session.user.id,
      keywords: rule.keywords,
      platforms: rule.platforms,
      start_time: rule.start_time || Date.now(),
      duration_ms: rule.duration_ms,
      use_regex: rule.use_regex || false,
      case_sensitive: rule.case_sensitive || false,
      match_whole_word: rule.match_whole_word || false,
    };

    // Insert the rule
    const { data, error } = await supabase
      .from('mute_rules')
      .insert(newRule)
      .select()
      .single();

    if (error) {
      console.error('Error adding mute rule:', error);
      return NextResponse.json(
        { error: 'Failed to add mute rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, rule: data });
  } catch (error) {
    console.error('Error in POST /api/supabase-mute-rules:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/supabase-mute-rules
 * Removes a mute rule by ID for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  try {
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

    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    // Delete the rule, ensuring it belongs to the authenticated user
    const { error } = await supabase
      .from('mute_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting mute rule:', error);
      return NextResponse.json(
        { error: 'Failed to delete mute rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/supabase-mute-rules:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/supabase-mute-rules/sync
 * Syncs mute rules between the web app and extension
 */
export async function PUT(request: NextRequest) {
  try {
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

    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { clientRules } = await request.json();

    if (!clientRules || !Array.isArray(clientRules)) {
      return NextResponse.json(
        { error: 'Invalid request: clientRules must be an array' },
        { status: 400 }
      );
    }

    // Get all server rules for this user
    const { data: serverRules, error } = await supabase
      .from('mute_rules')
      .select('*')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error fetching server rules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch server rules' },
        { status: 500 }
      );
    }

    // In a real implementation, you would merge the rules intelligently
    // For now, we'll just return the server rules

    return NextResponse.json({
      success: true,
      serverRules: serverRules,
    });
  } catch (error) {
    console.error('Error in PUT /api/supabase-mute-rules/sync:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
