# SilentZone Browser Extension

This Chrome extension allows you to filter web content based on keywords and topics you want to avoid.

## Features

- **Content Filtering**: Automatically detects and hides content containing muted keywords
- **Platform-Specific Rules**: Apply different rules to different platforms (Facebook, YouTube, Twitter, etc.)
- **Temporary Muting**: Set duration for how long keywords should be muted
- **Sync with Web App**: Synchronize mute rules with the SilentZone web application

## Installation (Development Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked" and select the `browser-extension` folder
4. The extension should now be installed and visible in your toolbar

## Usage

1. Click the SilentZone icon in your browser toolbar to open the popup
2. View active mute rules and their status
3. Click "Open SilentZone App" to manage your mute rules in the web application
4. Use "Sync Now" to manually synchronize with the web app

## Development

### Directory Structure

```
browser-extension/
├── images/              # Extension icons
├── popup/               # Popup UI files
│   ├── popup.html       # Popup HTML
│   ├── popup.css        # Popup styles
│   └── popup.js         # Popup functionality
├── scripts/             # Extension scripts
│   ├── background.js    # Background script
│   └── content.js       # Content script for filtering
├── styles/              # Styles for content filtering
│   └── content.css      # Content filtering styles
└── manifest.json        # Extension manifest
```

### Building for Production

For production deployment, you may want to:

1. Minify JavaScript and CSS files
2. Remove debug logging
3. Package the extension as a .zip file for submission to the Chrome Web Store

## Integration with SilentZone Web App

The extension communicates with the SilentZone web application to synchronize mute rules. By default, it connects to `http://localhost:9002` for development. Update the `webAppUrl` in the configuration to point to your production server.

## License

[MIT License](LICENSE)
