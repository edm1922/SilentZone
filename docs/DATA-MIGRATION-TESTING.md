# Data Migration Testing Guide

This document outlines the testing procedures for migrating data from Firebase to Supabase in the SilentZone application.

## Prerequisites

1. Access to both Firebase and Supabase dashboards
2. Firebase data export (JSON format)
3. Completed migration script setup
4. Test environment with both Firebase and Supabase configurations

## Test Environment Setup

1. Create a backup of all Firebase data before proceeding
2. Set up the migration script with the correct credentials:
   ```javascript
   const SUPABASE_URL = 'https://your-project-url.supabase.co';
   const SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key';
   const FIREBASE_EXPORT_PATH = './firebase-export.json';
   ```

3. Prepare a test dataset in Firebase that includes:
   - Multiple user accounts
   - Various mute rules with different configurations
   - Filter profiles (if implemented)
   - User settings

## Migration Process Testing

### 1. Data Export Verification

1. Export data from Firebase using the Firebase console
2. Verify the export file contains:
   - All user accounts
   - All mute rules
   - All filter profiles
   - All user settings
3. Check the JSON structure matches the expected format for the migration script

#### Expected Results
- Complete data export in valid JSON format
- All collections and documents are included
- Data structure is compatible with the migration script

### 2. Migration Script Execution

1. Run the migration script in dry-run mode (if available)
2. Review the output to ensure data mapping is correct
3. Run the actual migration script
4. Monitor for any errors or warnings

#### Expected Results
- Script executes without errors
- Progress indicators show successful migration
- Completion message indicates successful migration
- No data loss or corruption reported

### 3. Data Integrity Verification

#### User Accounts
1. Compare the number of users in Firebase and Supabase
2. Verify user emails, display names, and other profile information
3. Check that user IDs are correctly mapped or preserved

#### Mute Rules
1. Compare the total count of mute rules
2. Verify sample rules for:
   - Keywords
   - Platforms
   - Duration settings
   - Advanced options (regex, case sensitivity, etc.)
   - Creation and update timestamps

#### Filter Profiles (if implemented)
1. Compare the total count of profiles
2. Verify sample profiles for:
   - Name and description
   - Active status
   - Associated rules

#### User Settings
1. Compare user settings between Firebase and Supabase
2. Verify theme preferences, notification settings, etc.

#### Expected Results
- All data is migrated correctly
- Counts match between Firebase and Supabase
- Sample data verification shows identical content
- Relationships between entities are preserved

### 4. Application Functionality with Migrated Data

#### Web Application
1. Log in with a migrated user account
2. Verify all mute rules are displayed correctly
3. Test CRUD operations on mute rules
4. Check that user settings are applied correctly

#### Browser Extension
1. Log in with a migrated user account
2. Verify mute rules sync correctly
3. Test that content filtering works with migrated rules
4. Verify changes sync back to the Supabase database

#### Expected Results
- Application functions normally with migrated data
- All features work as expected
- No regression in functionality
- Data consistency is maintained during operations

### 5. Performance Testing

1. Measure and compare load times for:
   - Initial application load
   - Dashboard rendering
   - Mute rule list loading
   - Rule creation and updates
2. Monitor API response times
3. Check browser extension performance with migrated rules

#### Expected Results
- Performance is equal to or better than with Firebase
- No significant latency increases
- Smooth user experience

### 6. Error Recovery Testing

1. Simulate a failed migration (e.g., by interrupting the script)
2. Test the rollback procedure
3. Verify data integrity after rollback
4. Restart the migration and verify completion

#### Expected Results
- Failed migrations can be detected
- Rollback procedure restores system to a consistent state
- Migration can be resumed after addressing issues

## Post-Migration Verification

### 1. Data Consistency Check

1. Create new users and mute rules in the Supabase-backed application
2. Verify they are stored correctly
3. Update existing migrated data
4. Verify changes are persisted correctly

#### Expected Results
- New and updated data is stored correctly
- No conflicts with migrated data
- Data model is consistent

### 2. Authentication Verification

1. Test login with migrated user accounts
2. Test password reset functionality
3. Verify session management and token refresh

#### Expected Results
- All authentication flows work correctly
- User sessions are maintained appropriately
- Password reset works for migrated accounts

### 3. Long-term Data Access

1. Access historical data from before the migration
2. Verify data retention policies are applied correctly
3. Test any data archiving or cleanup processes

#### Expected Results
- Historical data remains accessible
- Data retention policies work as expected
- System performance is maintained over time

## Troubleshooting Common Issues

### Data Mapping Issues
- Check for schema differences between Firebase and Supabase
- Verify data type conversions (e.g., timestamps, arrays, nested objects)
- Check for special characters or encoding issues

### Missing Data
- Verify export completeness
- Check for collection or document size limits
- Ensure all subcollections are included in the export

### Performance Issues
- Check Supabase connection pooling settings
- Verify index creation on frequently queried fields
- Monitor database resource usage

## Rollback Plan

If critical issues are discovered after migration:

1. Disable write access to Supabase (if possible)
2. Re-enable Firebase connections in the application
3. Restore Firebase data from backup if necessary
4. Update application configuration to use Firebase
5. Communicate the rollback to users if necessary

## Migration Completion Checklist

- [ ] All data successfully migrated
- [ ] Data integrity verified
- [ ] Application functionality tested with migrated data
- [ ] Performance benchmarks met or exceeded
- [ ] Error recovery procedures tested
- [ ] Documentation updated to reflect Supabase usage
- [ ] Firebase dependencies removed
- [ ] Firebase services decommissioned (after confirmation period)
