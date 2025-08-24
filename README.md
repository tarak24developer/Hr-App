# Modern HRMS Application

A comprehensive Human Resource Management System built with modern web technologies.

## 🚀 Features

- **Employee Management**: Complete employee lifecycle management
- **Attendance Tracking**: Real-time attendance monitoring
- **Leave Management**: Automated leave request and approval system
- **Payroll Processing**: Comprehensive payroll management
- **Asset Management**: Track company assets and equipment
- **Training Management**: Employee training and development tracking
- **Reporting & Analytics**: Advanced reporting and insights
- **Role-based Access Control**: Secure user permissions
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Mobile-first approach

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+ 
- npm 9+
- Firebase project with Authentication and Firestore enabled

## 🔧 Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd modern-hrms-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration

**Important**: This application requires Firebase authentication to work. Demo mode has been removed.

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Get your Firebase configuration

### 4. Environment Variables

Copy the environment template and configure your Firebase credentials:

```bash
cp env.template .env.local
```

Edit `.env.local` with your Firebase project values:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔐 Authentication

- **Firebase Authentication Required**: No demo mode available
- **User Registration**: Self-registration with role assignment
- **Role-based Access**: Admin, HR, Manager, Employee roles
- **Secure Routes**: Protected routes based on authentication status

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── services/           # API and Firebase services
├── stores/             # State management (Zustand)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── hooks/              # Custom React hooks
```

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🔒 Security

- Firebase Authentication for user management
- Role-based access control
- Secure API endpoints
- Environment variable protection
- No hardcoded credentials

## 🌐 Deployment

The application is configured for deployment on Vercel with:
- Automatic builds on git push
- Environment variable management
- Performance optimization
- Analytics integration

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the Firebase documentation
- Review the environment configuration

---

**Note**: This application requires a properly configured Firebase project to function. Please ensure all Firebase services are enabled and configured before running the application. 