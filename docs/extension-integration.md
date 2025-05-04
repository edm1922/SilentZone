# SilentZone Extension Integration

This document describes how the SilentZone web application integrates with the Chrome extension.

## Overview

The SilentZone system consists of two main components:

1. **Web Application**: A Next.js application where users can create and manage mute rules
2. **Browser Extension**: A Chrome extension that applies these rules to filter web content

These components communicate through a REST API to synchronize mute rules.

## API Endpoints

The web application exposes the following API endpoints for the extension:

### `GET /api/mute-rules`

Returns all active mute rules.

**Response:**
```json
{
  "muteRules": [
    {
      "id": "123",
      "keywords": ["NBA", "Lakers"],
      "platforms": [
        { "id": "facebook", "name": "Facebook" }
      ],
      "startTime": 1620000000000,
      "durationMs": 86400000
    }
  ]
}
```

### `POST /api/mute-rules`

Adds a new mute rule.

**Request Body:**
```json
{
  "keywords": ["NBA", "Lakers"],
  "platforms": [
    { "id": "facebook", "name": "Facebook" }
  ],
  "durationMs": 86400000
}
```

**Response:**
```json
{
  "success": true,
  "rule": {
    "id": "123",
    "keywords": ["NBA", "Lakers"],
    "platforms": [
      { "id": "facebook", "name": "Facebook" }
    ],
    "startTime": 1620000000000,
    "durationMs": 86400000
  }
}
```

### `DELETE /api/mute-rules?id=123`

Removes a mute rule by ID.

**Response:**
```json
{
  "success": true
}
```

### `PUT /api/mute-rules/sync`

Synchronizes mute rules between the web app and extension.

**Request Body:**
```json
{
  "clientRules": [
    {
      "id": "123",
      "keywords": ["NBA", "Lakers"],
      "platforms": [
        { "id": "facebook", "name": "Facebook" }
      ],
      "startTime": 1620000000000,
      "durationMs": 86400000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "serverRules": [
    {
      "id": "123",
      "keywords": ["NBA", "Lakers"],
      "platforms": [
        { "id": "facebook", "name": "Facebook" }
      ],
      "startTime": 1620000000000,
      "durationMs": 86400000
    },
    {
      "id": "456",
      "keywords": ["Game of Thrones"],
      "platforms": [
        { "id": "all", "name": "All Platforms" }
      ],
      "startTime": 1620100000000,
      "durationMs": 604800000
    }
  ]
}
```

## Data Flow

1. **Creating a Mute Rule**:
   - User creates a mute rule in the web application
   - Web app saves the rule to its local state and the API
   - Extension periodically syncs with the API to get new rules

2. **Removing a Mute Rule**:
   - User removes a mute rule in the web application
   - Web app removes the rule from its local state and the API
   - Extension syncs with the API and removes the rule locally

3. **Applying Mute Rules**:
   - Extension's content script scans web pages for content matching mute rules
   - Matching content is hidden or blurred according to the rule settings
   - User can temporarily override muting for specific content

## Extension Components

The extension consists of several key components:

1. **Background Script**: Manages mute rules and communicates with the web app
2. **Content Script**: Scans web pages and applies mute rules
3. **Popup UI**: Provides a quick overview of active mute rules and controls

## Future Improvements

- **Real-time Sync**: Implement WebSocket or Server-Sent Events for immediate rule updates
- **User Authentication**: Add user accounts to support multiple users and devices
- **Rule Sharing**: Allow users to share mute rule sets with others
- **Analytics**: Track which rules are most effective and how often content is muted
- **Platform-Specific Filtering**: Optimize content detection for each supported platform
