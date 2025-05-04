#!/bin/bash

# Find all files that use the old auth context
FILES=$(find SilentZone -name "*.tsx" -o -name "*.ts" | xargs grep -l "useAuth\|auth-context" 2>/dev/null)

# Update each file
for file in $FILES; do
  echo "Updating $file..."
  
  # Replace imports
  sed -i 's/import { useAuth } from "@\/contexts\/auth-context";/import { useSupabaseAuth } from "@\/contexts\/supabase-auth-context";/g' "$file"
  sed -i 's/import { useMuteRules } from "@\/hooks\/use-mute-rules";/import { useSupabaseMuteRules } from "@\/hooks\/use-supabase-mute-rules";/g' "$file"
  
  # Replace usage
  sed -i 's/const { user } = useAuth()/const { user } = useSupabaseAuth()/g' "$file"
  sed -i 's/const { muteRules, isLoading } = useMuteRules()/const { muteRules, isLoading } = useSupabaseMuteRules()/g' "$file"
  sed -i 's/const { muteRules, isLoading, error, isUsingLocalStorage, deleteMuteRule } = useMuteRules()/const { muteRules, isLoading, error, isUsingLocalStorage, deleteMuteRule } = useSupabaseMuteRules()/g' "$file"
done

echo "Update complete!"
