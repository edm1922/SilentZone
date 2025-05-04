# SilentZone Developer Guide

This guide provides instructions for setting up the development environment and contributing to the SilentZone project.

## Project Overview

SilentZone is a cross-platform content filtering application that allows users to mute/hide specific content based on keywords across various platforms. The project consists of:

1. A Next.js web application
2. A Chrome browser extension
3. (Future) Mobile applications
4. (Future) Desktop applications

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Git
- Firebase CLI (`npm install -g firebase-tools`)
- Chrome browser (for extension development)

### Setting Up the Development Environment

1. **Clone the repository**

```bash
git clone https://github.com/edm1922/SilentZone.git
cd SilentZone
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Firebase**

```bash
# Login to Firebase
firebase login

# Initialize Firebase emulators
firebase init emulators
# Select Authentication and Firestore emulators when prompted
```

4. **Set up environment variables**

Create a `.env.local` file in the root directory with the following variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Optional: Google AI API Key (for AI topic detection)
GOOGLE_GENAI_API_KEY=your_google_ai_api_key
```

5. **Start the development server**

```bash
# Start Firebase emulators
firebase emulators:start --only auth,firestore

# In a separate terminal, start the Next.js development server
npm run dev
```

The web application will be available at http://localhost:9002

### Browser Extension Development

1. **Navigate to the extension directory**

```bash
cd browser-extension
```

2. **Install extension dependencies (if any)**

```bash
npm install
```

3. **Load the extension in Chrome**

- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode" using the toggle in the top-right corner
- Click "Load unpacked" and select the `browser-extension` folder

4. **Test the extension**

The extension should now be loaded in Chrome and can be tested on various websites.

## Project Structure

### Web Application

```
SilentZone/
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── (auth)/           # Authentication routes
│   │   ├── (protected)/      # Protected routes
│   │   ├── api/              # API routes
│   │   └── ...
│   ├── components/           # React components
│   │   ├── auth/             # Authentication components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── ui/               # UI components (shadcn/ui)
│   │   └── ...
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions and libraries
│   │   ├── firebase.ts       # Firebase initialization
│   │   ├── firebase-config.ts # Firebase configuration
│   │   └── ...
│   └── ...
├── public/                   # Static assets
├── docs/                     # Documentation
└── ...
```

### Browser Extension

```
browser-extension/
├── images/                   # Extension icons
├── popup/                    # Popup UI files
│   ├── popup.html            # Popup HTML
│   ├── popup.css             # Popup styles
│   └── popup.js              # Popup functionality
├── scripts/                  # Extension scripts
│   ├── background.js         # Background script
│   └── content.js            # Content script for filtering
├── styles/                   # Styles for content filtering
│   └── content.css           # Content filtering styles
└── manifest.json             # Extension manifest
```

## Development Workflow

### Feature Development

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Implement your changes, following the project's coding standards.

3. Write tests for your changes (when applicable).

4. Submit a pull request to the main branch.

### Testing

- **Web Application**: Use Jest and React Testing Library for unit and integration tests.
- **Browser Extension**: Test manually in Chrome and other browsers.

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Follow the component structure established in the project

## Firebase Emulators

For local development, we use Firebase emulators to avoid making real network requests to Firebase services.

### Starting the Emulators

```bash
firebase emulators:start --only auth,firestore
```

### Accessing the Emulator UI

The Emulator UI is available at http://localhost:4000

### Using the Emulators in Code

The Firebase initialization code in `src/lib/firebase.ts` is already set up to use the emulators in development mode.

## Deployment

### Web Application

The web application is deployed to Firebase Hosting:

```bash
npm run build
firebase deploy --only hosting
```

### Browser Extension

The browser extension is packaged and submitted to the Chrome Web Store:

1. Update the version in `manifest.json`
2. Create a ZIP file of the extension directory
3. Upload to the Chrome Web Store Developer Dashboard

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Troubleshooting

### Common Issues

1. **Firebase Authentication Network Error**
   - Make sure Firebase emulators are running
   - Check that the Firebase configuration is correct
   - Ensure the emulator connection code is working properly

2. **Extension Not Loading**
   - Check for errors in the Chrome extension console
   - Verify the manifest.json is valid
   - Reload the extension in Chrome

3. **Next.js Build Errors**
   - Check for TypeScript errors
   - Ensure all dependencies are installed
   - Check for missing environment variables

## Getting Help

If you encounter issues not covered in this guide, please:

1. Check existing GitHub issues
2. Create a new issue with detailed information about the problem
3. Reach out to the project maintainers

---

*This guide will be updated as the project evolves.*
