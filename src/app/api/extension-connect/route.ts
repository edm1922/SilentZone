import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

/**
 * POST /api/extension-connect
 * 
 * This endpoint registers an extension connection and returns the current user's token.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the connection ID from the request body
    const { connectionId } = await request.json();
    
    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Extension connection request with ID: ${connectionId}`);
    
    // Create a Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No active session found for extension connection', sessionError);
      return NextResponse.json(
        { success: false, error: 'No active session found' },
        { status: 401 }
      );
    }
    
    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No user found for extension connection', userError);
      return NextResponse.json(
        { success: false, error: 'No user found' },
        { status: 401 }
      );
    }
    
    console.log(`Found user for extension connection: ${user.email}`);
    
    // Store the connection in a temporary database table or in-memory store
    // For simplicity, we'll just return success here
    
    // Return success with the token and user data
    return NextResponse.json({
      success: true,
      connectionId,
      token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      }
    });
  } catch (error) {
    console.error('Error in extension connection endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/extension-connect
 * 
 * This endpoint allows the extension to retrieve the token for a given connection ID.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the connection ID from the query parameters
    const url = new URL(request.url);
    const connectionId = url.searchParams.get('connectionId');
    
    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Extension token request for connection ID: ${connectionId}`);
    
    // Create a Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No active session found for extension token request', sessionError);
      return NextResponse.json(
        { success: false, error: 'No active session found' },
        { status: 401 }
      );
    }
    
    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No user found for extension token request', userError);
      return NextResponse.json(
        { success: false, error: 'No user found' },
        { status: 401 }
      );
    }
    
    console.log(`Found user for extension token request: ${user.email}`);
    
    // Return the token and user data
    return NextResponse.json({
      success: true,
      token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      }
    });
  } catch (error) {
    console.error('Error in extension token endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
