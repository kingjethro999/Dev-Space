<div align="center">
  <img src="public/dev-space-icon-transparent.png" alt="Dev Space Logo" width="120" height="120">
  <h1>Dev Space 🚀</h1>
  <p><strong>A comprehensive developer community platform built by King Jethro</strong></p>
</div>

[![GitHub](https://img.shields.io/badge/GitHub-kingjethro999-blue?style=flat-square&logo=github)](https://github.com/kingjethro999)
[![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Real-time](https://img.shields.io/badge/Real--time-Enabled-green?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Email](https://img.shields.io/badge/Email-System-blue?style=flat-square&logo=gmail)](https://gmail.com/)

## 🌟 About

Dev Space is a modern, enterprise-level developer community platform designed to connect developers worldwide. Built with passion by **King Jethro**, this platform enables developers to share projects, collaborate on code, engage in discussions, and build amazing things together with real-time features and professional communication tools.

### ✨ Key Features

- **🔐 Authentication** - Firebase-powered auth with GitHub & Google OAuth
- **⚡ Real-time Features** - Live engagement, messaging, and notifications
- **📱 Activity Feed** - Real-time activity stream with filtering and engagement
- **💼 Project Management** - GitHub integration, task tracking, and team collaboration
- **💬 Discussions** - Community discussions with categories and real-time comments
- **💌 Messaging** - Direct messaging between developers with real-time sync
- **👤 Profiles** - Comprehensive user profiles with skills and bio
- **🔍 Search** - Advanced search functionality across projects and discussions
- **📧 Email System** - Professional welcome emails and notifications
- **🔔 Notifications** - Real-time in-app and email notifications
- **📊 Admin Dashboard** - Performance monitoring and platform management
- **🌙 Dark/Light Mode** - Modern theme switching with system preference
- **📱 Mobile Responsive** - Optimized for all devices and screen sizes

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with modern patterns
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Radix UI** - Accessible component library
- **Lucide React** - Beautiful icons and illustrations
- **Framer Motion** - Smooth animations and transitions
- **next-themes** - Dark/light mode support

### Backend & Services
- **Firebase Auth** - Authentication with Google & GitHub OAuth
- **Firestore** - NoSQL database for real-time data
- **Firebase Realtime Database** - Live engagement and messaging
- **Firebase Storage** - File and image storage
- **Cloudinary** - Advanced media storage and optimization
- **Gmail SMTP** - Professional email system with Nodemailer
- **Vercel Analytics** - Performance monitoring

### Real-time Features
- **Live Engagement** - Real-time likes, comments, shares, and views
- **Instant Messaging** - Direct messaging with read receipts
- **Live Notifications** - Real-time in-app and email notifications
- **Activity Streams** - Live updates from followed developers
- **Collaborative Features** - Real-time project collaboration

### Development Tools
- **ESLint** - Code linting and quality assurance
- **PostCSS** - CSS processing and optimization
- **pnpm** - Fast package manager
- **date-fns** - Date manipulation and formatting

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Firebase project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kingjethro999/dev-space.git
   cd dev-space
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password, Google, GitHub)
   - Create a Firestore database
   - Enable Firebase Realtime Database
   - Update `lib/firebase.ts` with your Firebase config

4. **Set up Email System**
   - Configure Gmail SMTP credentials in `lib/mail.tsx`
   - Set up Cloudinary account for media storage
   - Update `lib/CLOUDINARY.tsx` with your credentials

5. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
dev-space/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes (email, etc.)
│   ├── auth/              # Authentication pages
│   ├── discussions/       # Community discussions
│   ├── discover/          # Project discovery
│   ├── docs/              # Documentation
│   ├── feed/              # Activity feed
│   ├── messages/          # Direct messaging
│   ├── projects/          # Project management
│   ├── profile/           # User profiles
│   └── search/            # Search functionality
├── components/            # Reusable UI components
│   ├── ui/               # Radix UI components
│   ├── chat.tsx          # Real-time chat component
│   ├── post-engagement.tsx # Real-time engagement
│   └── notifications-center.tsx # Notification system
├── lib/                   # Utility functions and configs
│   ├── firebase.ts        # Firebase configuration
│   ├── realtime-utils.ts  # Real-time features
│   ├── mail-utils.ts      # Email system
│   ├── cloudinary-utils.ts # Media storage
│   └── auth-context.tsx   # Authentication context
├── hooks/                 # Custom React hooks
├── public/               # Static assets
│   └── illustrations/    # UI illustrations
└── styles/              # Global styles
```

## 🎨 Features in Detail

### 🔐 Authentication System
- **Multi-provider Auth** - Email/password, Google OAuth, GitHub OAuth
- **Secure Session Management** - Firebase-powered authentication
- **Profile Management** - Comprehensive user profiles with skills and bio
- **Route Protection** - Middleware-based authentication guards

### ⚡ Real-time Features
- **Live Engagement** - Real-time likes, comments, shares, and view counts
- **Instant Messaging** - Direct messaging with read receipts and typing indicators
- **Live Notifications** - Real-time in-app and email notifications
- **Activity Streams** - Live updates from followed developers
- **Collaborative Tools** - Real-time project collaboration and task management

### 📱 Activity Feed
- **Real-time Updates** - Live activity stream with instant updates
- **Smart Filtering** - Filter by activity type, user, and time
- **Engagement Tracking** - Track likes, comments, and interactions
- **Responsive Design** - Optimized for all devices

### 💼 Project Management
- **GitHub Integration** - Seamless repository connection
- **Task Tracking** - Milestone and task management
- **Team Collaboration** - Real-time collaboration tools
- **Project Visibility** - Public/private project controls
- **Code Reviews** - Built-in code review system

### 💬 Community Features
- **Categorized Discussions** - Organized community discussions
- **Real-time Comments** - Live commenting system
- **Tag-based Organization** - Smart content categorization
- **Advanced Search** - Search across projects, discussions, and users

### 💌 Messaging System
- **Direct Messaging** - Private conversations between users
- **Real-time Sync** - Instant message delivery and sync
- **Read Receipts** - Message read status tracking
- **User Discovery** - Find and connect with developers

### 📧 Email System
- **Welcome Emails** - Professional onboarding emails for new users
- **Returning User Emails** - "Glad to have you back" messages
- **Notification Emails** - Important event notifications
- **Professional Templates** - Branded email templates with Dev Space logo
- **SMTP Integration** - Gmail SMTP with Nodemailer

### 🔔 Notification System
- **Real-time Notifications** - Instant in-app notifications
- **Email Notifications** - Important event email alerts
- **Smart Filtering** - Customizable notification preferences
- **Notification Center** - Centralized notification management

### 🌙 Modern UI/UX
- **Dark/Light Mode** - System preference-based theme switching
- **Responsive Design** - Mobile-first, optimized for all devices
- **Professional Design** - Enterprise-level UI with custom design system
- **Smooth Animations** - Framer Motion-powered transitions
- **Accessibility** - Radix UI components with full accessibility support

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables**
   - Add your Firebase configuration
   - Configure Gmail SMTP credentials
   - Set up Cloudinary credentials
3. **Deploy**
   - Automatic deployments on push to main branch
   - Real-time features enabled by default

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Creator

**King Jethro** - [@kingjethro999](https://github.com/kingjethro999)

A passionate developer who believes in the power of community and collaboration. Building tools that bring developers together and make the world a better place through code.

## 🙏 Acknowledgments

- The amazing Next.js team for the incredible framework
- Firebase team for the robust backend services and real-time capabilities
- Radix UI team for the accessible component library
- Cloudinary team for the powerful media management platform
- The open-source community for inspiration and support
- All the developers who contribute to making the web a better place

---

**Built with ❤️ by King Jethro**

*Connect, collaborate, and grow with developers worldwide.*
