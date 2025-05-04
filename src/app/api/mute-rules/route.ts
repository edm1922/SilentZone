import { NextRequest, NextResponse } from 'next/server';

// This is a simple in-memory store for demonstration purposes
// In a real application, you would use a database
let muteRules: any[] = [];

/**
 * GET /api/mute-rules
 * Returns all mute rules
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ muteRules });
}

/**
 * POST /api/mute-rules
 * Adds a new mute rule
 */
export async function POST(request: NextRequest) {
  try {
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
    
    if (!rule.durationMs || typeof rule.durationMs !== 'number' || rule.durationMs <= 0) {
      return NextResponse.json(
        { error: 'Invalid rule: durationMs is required and must be positive' },
        { status: 400 }
      );
    }
    
    // Generate ID if not provided
    if (!rule.id) {
      rule.id = crypto.randomUUID();
    }
    
    // Add timestamp if not provided
    if (!rule.startTime) {
      rule.startTime = Date.now();
    }
    
    // Add the rule
    muteRules.push(rule);
    
    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('Error adding mute rule:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/mute-rules/:id
 * Removes a mute rule by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }
    
    const initialLength = muteRules.length;
    muteRules = muteRules.filter(rule => rule.id !== id);
    
    if (muteRules.length === initialLength) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing mute rule:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/mute-rules/sync
 * Syncs mute rules between the web app and extension
 */
export async function PUT(request: NextRequest) {
  try {
    const { clientRules } = await request.json();
    
    if (!clientRules || !Array.isArray(clientRules)) {
      return NextResponse.json(
        { error: 'Invalid request: clientRules must be an array' },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would merge the rules intelligently
    // For now, we'll just return the server rules
    
    return NextResponse.json({
      success: true,
      serverRules: muteRules,
    });
  } catch (error) {
    console.error('Error syncing mute rules:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
