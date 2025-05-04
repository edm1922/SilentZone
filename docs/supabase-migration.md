# Migrating from Firebase to Supabase

This document outlines the steps to migrate SilentZone from Firebase to Supabase.

## Prerequisites

1. Create a Supabase account and project at [supabase.com](https://supabase.com)
2. Set up environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Database Setup

1. Run the SQL migration script in the Supabase SQL Editor:
   - Navigate to `supabase/migrations/20240715000000_create_mute_rules_table.sql`
   - Copy the contents and run them in the Supabase SQL Editor

## Code Migration Steps

1. Install Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Replace Firebase authentication with Supabase authentication:
   - Use `src/contexts/supabase-auth-context.tsx` instead of `src/contexts/auth-context.tsx`
   - Update all imports from `useAuth` to `useSupabaseAuth`

3. Replace Firebase Firestore with Supabase Database:
   - Use `src/hooks/use-supabase-mute-rules.ts` instead of `src/hooks/use-mute-rules.ts`
   - Update all imports accordingly

4. Update components to use the new Supabase hooks and contexts

## Data Migration

To migrate existing data from Firebase to Supabase:

1. Export data from Firebase:
   - Go to Firebase Console > Firestore Database
   - Click on "Export Data"

2. Transform the data to match Supabase schema:
   - Convert camelCase fields to snake_case
   - Adjust data types as needed

3. Import data to Supabase:
   - Use the Supabase UI or API to import the transformed data

## Cleanup

After successful migration and testing:

1. Remove Firebase dependencies:
   ```bash
   npm uninstall firebase firebase-admin
   ```

2. Remove Firebase configuration files:
   - `src/lib/firebase.ts`
   - `src/lib/firebase-config.ts`
   - `firestore.rules`
   - `firestore.indexes.json`

3. Remove Firebase emulator configurations if any

## Testing

1. Test authentication flows:
   - Sign up
   - Sign in
   - Password reset
   - Profile update

2. Test data operations:
   - Create mute rules
   - Read mute rules
   - Update mute rules
   - Delete mute rules

## Troubleshooting

- Check browser console for errors
- Verify Supabase project settings
- Ensure Row Level Security (RLS) policies are correctly set up
- Verify environment variables are correctly set
