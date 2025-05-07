import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Use the edge runtime to avoid cookie issues
export const runtime = 'edge';

/**
 * API endpoint for syncing mute rules with the browser extension using service role
 */
// Map to track client rule IDs to server rule IDs
let clientToServerIdMap: Map<string, string> | null = null;

/**
 * GET handler for retrieving mute rules without syncing
 * This is used by the extension to get the current rules without sending its own rules
 * which prevents accidental deletion of rules
 */
export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/supabase-mute-rules/sync-with-service-role: Received request');

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

    // Get user's mute rules from Supabase
    const { data: muteRules, error } = await supabaseAdmin
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

    console.log(`Found ${muteRules?.length || 0} rules for user ID:`, user.id);

    // Format rules for the extension
    const formattedRules = (muteRules || []).map(rule => {
      console.log('Formatting rule:', rule.id);

      // Handle platforms field properly
      let platforms = [];
      if (Array.isArray(rule.platforms)) {
        platforms = rule.platforms;
      } else if (typeof rule.platforms === 'string') {
        // Handle single string platform
        platforms = [{ id: rule.platforms, name: rule.platforms }];
      } else if (rule.platforms && typeof rule.platforms === 'object') {
        // Convert object to array if needed
        platforms = Object.entries(rule.platforms).map(([key, value]) => {
          if (typeof value === 'string') {
            return { id: value, name: value };
          } else if (typeof value === 'object' && value !== null) {
            return { id: key, ...(value as object) };
          }
          return { id: key, name: String(value) };
        });
      } else {
        // Default to 'all' platform if nothing valid
        platforms = [{ id: 'all', name: 'All Platforms' }];
      }

      return {
        id: rule.id,
        keywords: Array.isArray(rule.keywords) ? rule.keywords : [String(rule.keywords || 'unknown')],
        platforms: platforms,
        startTime: rule.start_time,
        durationMs: rule.duration_ms,
        useRegex: rule.use_regex,
        caseSensitive: rule.case_sensitive,
        matchWholeWord: rule.match_whole_word
      };
    });

    console.log('Returning', formattedRules.length, 'rules');

    // Return the rules
    return NextResponse.json({
      success: true,
      serverRules: formattedRules
    });
  } catch (error) {
    console.error('Unexpected error in extension sync GET endpoint:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log('PUT /api/supabase-mute-rules/sync-with-service-role: Received request');

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

    console.log('Using service role key for database operations');

    // Parse request body
    const body = await req.json();
    const { clientRules, forceSync } = body;

    if (!clientRules || !Array.isArray(clientRules)) {
      console.error('Invalid clientRules:', clientRules);
      return NextResponse.json(
        { error: 'Invalid request', message: 'clientRules must be an array' },
        { status: 400 }
      );
    }

    // Check if this is a force sync
    const isForceSync = forceSync === true || req.headers.get('x-force-sync') === 'true';
    const syncType = req.headers.get('x-sync-type') || 'update';

    console.log(`Client rules received: ${clientRules.length}, Sync type: ${syncType}, Force sync: ${isForceSync}`);

    // Get user's mute rules from Supabase using admin client
    console.log('Fetching mute rules for user:', user.id, user.email);

    const { data: muteRules, error } = await supabaseAdmin
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
      console.log('Sample rule ID:', muteRules[0].id);
      console.log('Sample rule user_id:', muteRules[0].user_id);
      console.log('Sample rule keywords:', JSON.stringify(muteRules[0].keywords));
    } else {
      console.log('No rules found for user ID:', user.id);

      // Double-check with a direct query to see all rules
      const { data: allRules, error: allRulesError } = await supabaseAdmin
        .from('mute_rules')
        .select('id, user_id, keywords')
        .limit(10);

      if (allRulesError) {
        console.error('Error fetching all rules:', allRulesError);
      } else {
        console.log('All rules in database (up to 10):', JSON.stringify(allRules));
      }
    }

    // Create a variable to hold our working set of rules
    // Start with the rules we fetched initially
    let currentRules = muteRules || [];

    // Get IDs of rules on server and client
    const serverRuleIds = currentRules.map(rule => rule.id);
    const clientRuleIds = clientRules.map(rule => rule.id);

    // Process deletions: Find rules that exist on server but not in client
    // This means they were deleted in the extension and should be deleted on the server too
    // BUT ONLY if the client has sent us rules (clientRules.length > 0)
    // If the client has no rules, we should NOT delete anything from the server
    if (currentRules.length > 0 && clientRules.length > 0) {
      // Only consider deletion if the client has explicitly sent rules
      // This prevents accidental deletion when the extension is first opened

      // IMPORTANT: We need to be very careful about rule deletion
      // We'll only delete rules that we're SURE were deleted in the client

      // First, check if this is a fresh sync (client just opened) or a deliberate sync (user deleted a rule)
      // We can tell by checking the request headers
      const isFreshSync = req.headers.get('x-sync-type') === 'initial';
      const isAfterDeletion = req.headers.get('x-after-deletion') === 'true';

      // If this is a force sync, we'll allow deletions even on initial sync
      // This is used when we need to ensure the server matches the client exactly
      if (isFreshSync && !isForceSync && !isAfterDeletion) {
        console.log('This appears to be an initial sync. Skipping deletion to prevent accidental data loss.');
      } else {
        console.log(`Processing deletions. Force sync: ${isForceSync}, After deletion: ${isAfterDeletion}`);

        // If this is a force sync, we'll trust the client's state completely
        if (isForceSync) {
          console.log('Force sync enabled - client state will be treated as the source of truth');
        }
        // This is likely a deliberate sync after rule deletion
        const rulesToDelete = currentRules.filter(rule => !clientRuleIds.includes(rule.id));

        if (rulesToDelete.length > 0) {
          console.log(`Found ${rulesToDelete.length} rules to delete from server`);

          // SAFETY CHECK: Don't delete ALL rules at once - this is likely an error
          // But if this is a force sync, we'll allow it
          if (rulesToDelete.length === currentRules.length && currentRules.length > 1 && !isForceSync) {
            console.error('SAFETY BLOCK: Attempted to delete ALL rules. This is likely an error. Skipping deletion.');
          } else {
            // If this is a force sync and we're deleting all rules, log it but proceed
            if (rulesToDelete.length === currentRules.length && currentRules.length > 1 && isForceSync) {
              console.log('FORCE SYNC: Deleting ALL rules as requested by client');
            }
            // Delete rules that were removed in the client
            for (const rule of rulesToDelete) {
              console.log(`Deleting rule ${rule.id} from server`);

              // Double check that this rule actually exists in the database
              const { data: ruleExists, error: checkError } = await supabaseAdmin
                .from('mute_rules')
                .select('id')
                .eq('id', rule.id)
                .eq('user_id', user.id)
                .single();

              if (checkError) {
                console.error(`Error checking if rule ${rule.id} exists:`, checkError);
                continue; // Skip this rule
              }

              if (!ruleExists) {
                console.log(`Rule ${rule.id} not found in database, skipping deletion`);
                continue; // Skip this rule
              }

              // Now proceed with deletion
              const { error: deleteError } = await supabaseAdmin
                .from('mute_rules')
                .delete()
                .eq('id', rule.id)
                .eq('user_id', user.id); // Safety check to ensure we only delete user's own rules

              if (deleteError) {
                console.error(`Error deleting rule ${rule.id}:`, deleteError);
              } else {
                console.log(`Successfully deleted rule ${rule.id}`);
              }
            }
          }
        } else {
          console.log('No rules to delete from server');
        }
      }
    } else if (clientRules.length === 0) {
      console.log('Client has no rules. Skipping deletion to prevent accidental data loss.');
    }

    // Process additions: Find rules that exist in client but not on server
    // This means they were created in the extension and should be added to the server
    const rulesToAdd = clientRules.filter(rule => !serverRuleIds.includes(rule.id));

    if (rulesToAdd.length > 0) {
      console.log(`Found ${rulesToAdd.length} new rules to add to server`);

      // Add rules that were created in the client
      for (const rule of rulesToAdd) {
        console.log(`Adding rule ${rule.id} to server with keywords:`, rule.keywords);

        // Convert rule to server format
        // Note: We need to handle the ID format - if it's not a UUID, we'll generate one
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rule.id);

        const serverRule = {
          // If the ID is not a UUID, don't include it so Supabase will generate one
          ...(isUuid ? { id: rule.id } : {}),
          user_id: user.id,
          keywords: rule.keywords,
          platforms: rule.platforms,
          start_time: rule.startTime || Date.now(),
          duration_ms: rule.durationMs || (7 * 24 * 60 * 60 * 1000), // Default to 7 days
          use_regex: rule.useRegex || false,
          case_sensitive: rule.caseSensitive || false,
          match_whole_word: rule.matchWholeWord || false
        };

        // Insert the rule into the database and return the inserted record
        const { data: insertedRule, error: insertError } = await supabaseAdmin
          .from('mute_rules')
          .insert(serverRule)
          .select()
          .single();

        if (insertError) {
          console.error(`Error adding rule ${rule.id}:`, insertError);
        } else {
          console.log(`Successfully added rule with server ID ${insertedRule.id} (client ID: ${rule.id})`);

          // Create a mapping between client ID and server ID for tracking
          console.log(`Mapping client ID ${rule.id} to server ID ${insertedRule.id}`);

          // Store the mapping for later use
          if (!clientToServerIdMap) {
            clientToServerIdMap = new Map();
          }
          clientToServerIdMap.set(rule.id, insertedRule.id);
        }
      }
    } else {
      console.log('No new rules to add to server');
    }

    // Fetch updated rules after all operations
    const { data: updatedRules, error: updateError } = await supabaseAdmin
      .from('mute_rules')
      .select('*')
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error fetching updated rules:', updateError);
    } else {
      console.log(`After sync: ${updatedRules.length} rules in database`);
      // Update our working set with the latest rules from the database
      currentRules = updatedRules;
    }

    // Format rules for the extension
    const formattedRules = currentRules.map(rule => {
      console.log('Formatting rule:', rule.id);

      // Handle platforms field properly
      let platforms = [];
      if (Array.isArray(rule.platforms)) {
        platforms = rule.platforms;
      } else if (typeof rule.platforms === 'string') {
        // Handle single string platform
        platforms = [{ id: rule.platforms, name: rule.platforms }];
      } else if (rule.platforms && typeof rule.platforms === 'object') {
        // Convert object to array if needed
        platforms = Object.entries(rule.platforms).map(([key, value]) => {
          if (typeof value === 'string') {
            return { id: value, name: value };
          } else if (typeof value === 'object' && value !== null) {
            return { id: key, ...(value as object) };
          }
          return { id: key, name: String(value) };
        });
      } else {
        // Default to 'all' platform if nothing valid
        platforms = [{ id: 'all', name: 'All Platforms' }];
      }

      console.log('Formatted platforms:', JSON.stringify(platforms));

      return {
        id: rule.id,
        keywords: Array.isArray(rule.keywords) ? rule.keywords : [String(rule.keywords || 'unknown')],
        platforms: platforms,
        startTime: rule.start_time,
        durationMs: rule.duration_ms,
        useRegex: rule.use_regex,
        caseSensitive: rule.case_sensitive,
        matchWholeWord: rule.match_whole_word
      };
    });

    console.log('Formatted rules:', formattedRules.length);

    // Convert the ID mapping to a format that can be serialized to JSON
    const idMapping = clientToServerIdMap ?
      Array.from(clientToServerIdMap.entries()).reduce((obj, [clientId, serverId]) => {
        obj[clientId] = serverId;
        return obj;
      }, {} as Record<string, string>) :
      {};

    // Return the rules and ID mapping
    return NextResponse.json({
      success: true,
      serverRules: formattedRules,
      idMapping: idMapping
    });
  } catch (error) {
    console.error('Unexpected error in extension sync endpoint:', error);
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
