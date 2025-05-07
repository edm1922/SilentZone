// Local storage utility for mute rules
import { MuteRule } from "@/hooks/use-supabase-mute-rules";

const MUTE_RULES_KEY = "silentzone_mute_rules";

// Save mute rules to local storage
export const saveMuteRulesToLocalStorage = (userId: string, rules: MuteRule[]): void => {
  try {
    console.log(`[LocalStorage] Saving ${rules.length} rules for user ${userId}`);

    // Group rules by user ID to support multiple users
    const allRules = getAllMuteRulesFromLocalStorage();
    allRules[userId] = rules;

    const jsonData = JSON.stringify(allRules);
    console.log(`[LocalStorage] Stringified data to save:`, jsonData);

    localStorage.setItem(MUTE_RULES_KEY, jsonData);

    // Verify the data was saved
    const savedData = localStorage.getItem(MUTE_RULES_KEY);
    console.log(`[LocalStorage] Verification - Data saved:`, !!savedData);
    console.log(`[LocalStorage] Verification - Data length:`, savedData?.length || 0);
  } catch (error) {
    console.error("Error saving mute rules to local storage:", error);
  }
};

// Get mute rules from local storage for a specific user
export const getMuteRulesFromLocalStorage = (userId: string): MuteRule[] => {
  try {
    console.log(`[LocalStorage] Getting rules for user ${userId}`);
    const allRules = getAllMuteRulesFromLocalStorage();
    const userRules = allRules[userId] || [];
    console.log(`[LocalStorage] Found ${userRules.length} rules for user ${userId}`, userRules);
    return userRules;
  } catch (error) {
    console.error("Error getting mute rules from local storage:", error);
    return [];
  }
};

// Get all mute rules from local storage (grouped by user ID)
export const getAllMuteRulesFromLocalStorage = (): Record<string, MuteRule[]> => {
  try {
    const rulesJson = localStorage.getItem(MUTE_RULES_KEY);
    console.log(`[LocalStorage] Raw data from localStorage:`, rulesJson);

    if (!rulesJson) {
      console.log(`[LocalStorage] No data found in localStorage for key ${MUTE_RULES_KEY}`);
      return {};
    }

    const parsed = JSON.parse(rulesJson);
    console.log(`[LocalStorage] Parsed data:`, parsed);
    return parsed;
  } catch (error) {
    console.error("Error parsing mute rules from local storage:", error);
    return {};
  }
};

// Add a single mute rule to local storage
export const addMuteRuleToLocalStorage = (rule: any): void => {
  try {
    const userId = rule.userId || rule.user_id;
    console.log(`[LocalStorage] Adding/updating rule ${rule.id} for user ${userId}`, rule);

    const rules = getMuteRulesFromLocalStorage(userId);

    // Check if rule with this ID already exists
    const existingIndex = rules.findIndex(r => r.id === rule.id);

    if (existingIndex >= 0) {
      // Update existing rule
      console.log(`[LocalStorage] Updating existing rule at index ${existingIndex}`);
      rules[existingIndex] = rule;
    } else {
      // Check if this is a Supabase rule and we already have a local version
      if (rule.id.startsWith('supabase-')) {
        const supabaseId = rule.id.replace('supabase-', '');
        // Look for any local rules that might be duplicates of this Supabase rule
        const localRuleIndex = rules.findIndex(r =>
          !r.id.startsWith('supabase-') &&
          JSON.stringify(r.keywords) === JSON.stringify(rule.keywords)
        );

        if (localRuleIndex >= 0) {
          console.log(`[LocalStorage] Found potential duplicate local rule at index ${localRuleIndex}, replacing it`);
          rules[localRuleIndex] = rule;
        } else {
          // Add new rule
          console.log(`[LocalStorage] Adding new Supabase rule`);
          rules.push(rule);
        }
      } else {
        // Add new local rule
        console.log(`[LocalStorage] Adding new local rule`);
        rules.push(rule);
      }
    }

    // Remove any duplicate rules
    const uniqueRules = [];
    const ruleIds = new Set();

    for (const r of rules) {
      if (!ruleIds.has(r.id)) {
        ruleIds.add(r.id);
        uniqueRules.push(r);
      } else {
        console.warn(`[LocalStorage] Removing duplicate rule with ID ${r.id}`);
      }
    }

    if (uniqueRules.length !== rules.length) {
      console.warn(`[LocalStorage] Removed ${rules.length - uniqueRules.length} duplicate rules`);
    }

    saveMuteRulesToLocalStorage(userId, uniqueRules);

    // Verify the rule was saved
    const verifyRules = getMuteRulesFromLocalStorage(userId);
    const savedRule = verifyRules.find(r => r.id === rule.id);
    console.log(`[LocalStorage] Verification - Rule saved:`, !!savedRule);
  } catch (error) {
    console.error("Error adding mute rule to local storage:", error);
  }
};

// Remove a mute rule from local storage
export const removeMuteRuleFromLocalStorage = (userId: string, ruleId: string): void => {
  try {
    const rules = getMuteRulesFromLocalStorage(userId);
    const updatedRules = rules.filter(rule => rule.id !== ruleId);

    saveMuteRulesToLocalStorage(userId, updatedRules);
    console.log(`Removed rule ${ruleId} from local storage for user ${userId}`);
  } catch (error) {
    console.error("Error removing mute rule from local storage:", error);
  }
};

// Clear all mute rules for a user from local storage
export const clearMuteRulesFromLocalStorage = (userId: string): void => {
  try {
    saveMuteRulesToLocalStorage(userId, []);
    console.log(`Cleared all rules from local storage for user ${userId}`);
  } catch (error) {
    console.error("Error clearing mute rules from local storage:", error);
  }
};

// Generate a temporary ID for local rules
export const generateLocalRuleId = (): string => {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
