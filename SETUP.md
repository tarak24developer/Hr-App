# HRMS App Setup Guide

## Firebase Configuration

The app requires Firebase to be properly configured to function. Follow these steps to set up Firebase:

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Follow the setup wizard

### 2. Get Firebase Configuration

1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname
6. Copy the configuration object

### 3. Set Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable Email/Password authentication
4. Add your first user or enable sign-up

### 5. Set Up Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location close to your users

### 6. Set Up Firestore Security Rules

Update your Firestore security rules to allow read/write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 7. Install Dependencies

```bash
npm install
```

### 8. Start the Development Server

```bash
npm run dev
```

## Troubleshooting

### "Failed to load dashboard statistics" Error

This error occurs when:
- Firebase is not configured
- Environment variables are missing
- Firestore collections don't exist
- Network connectivity issues

**Solutions:**
1. Check that your `.env` file exists and has correct values
2. Verify Firebase project is active
3. Check browser console for specific error messages
4. Ensure you're connected to the internet

### Mobile Responsiveness

The app is now fully responsive with:
- Mobile-first design approach
- Touch-friendly interface
- Responsive breakpoints (xs, sm, md, lg, xl)
- Mobile navigation menu
- Optimized layouts for all screen sizes

### Performance Features

- Lazy loading of components
- Optimized images and assets
- Efficient state management
- Responsive design patterns

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API and external services
├── stores/        # State management
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── hooks/         # Custom React hooks
```

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify Firebase configuration
3. Check network connectivity
4. Review the troubleshooting section above
