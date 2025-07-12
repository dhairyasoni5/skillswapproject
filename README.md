# Swap Hub Connect - Skill Exchange Platform

A modern web application that connects people who want to exchange skills and knowledge. Built with React, TypeScript, Supabase, and Tailwind CSS.

## 🌟 Features

### Core Functionality
- **Skill Exchange**: Users can offer skills they have and request skills they want to learn
- **Profile Management**: Create and customize your profile with skills, location, and availability
- **Request System**: Send and manage skill swap requests with messaging
- **Rating System**: Rate completed swaps to build reputation
- **Search & Filter**: Find users by skills, location, and availability
- **Real-time Updates**: Live notifications and status updates

### Admin Features
- **User Management**: Ban/unban users, view user statistics
- **Skill Moderation**: Approve or reject new skills added to the platform
- **Swap Management**: Monitor and manage all swap requests
- **Platform Notifications**: Send announcements and updates to all users
- **Analytics Dashboard**: View platform statistics and generate reports
- **Audit Logging**: Track all admin actions for security

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Beautiful interface built with shadcn/ui components
- **Authentication**: Secure user authentication with Supabase Auth
- **Privacy Controls**: Public/private profile settings
- **Toast Notifications**: User-friendly feedback system

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing

### UI/UX
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide React** - Beautiful icons
- **Sonner** - Toast notifications

### Backend & Data
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **PostgreSQL** - Database with Row Level Security (RLS)
- **Supabase Auth** - Authentication and authorization
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, or bun
- Supabase account and project

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd swap-hub-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the database migrations in `supabase/migrations/`:
     ```bash
     supabase db push
     ```
   - Get your Supabase URL and anon key from the project settings

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173` to see the application.

## 🗄️ Database Schema

The application uses the following main tables:

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **profiles** | User profiles | Personal info, admin status, ban status |
| **skills** | Available skills | Name, category, approval status |
| **user_skills** | User-skill relationships | Offered/wanted skills |
| **swap_requests** | Skill exchange requests | Status tracking, messaging |
| **ratings** | User feedback | Post-swap ratings and reviews |
| **platform_messages** | Admin announcements | System-wide notifications |
| **admin_logs** | Audit trail | Admin action tracking |
| **skill_moderation_queue** | Skill approval workflow | Pending skill reviews |

### Security Features
- **Row Level Security (RLS)** - Comprehensive data protection policies
- **Admin-only Access** - Sensitive operations restricted to admins
- **User Authentication** - Secure login with Supabase Auth
- **Audit Logging** - All admin actions are tracked
- **Ban System** - User management with reason tracking

## 🎯 Key Features Explained

### Skill Exchange Process
1. **Profile Creation** - Users create profiles and add skills they can offer
2. **Skill Discovery** - Users browse other profiles and find skills they want to learn
3. **Request Initiation** - Users send swap requests with personalized messages
4. **Request Management** - Recipients can accept, reject, or complete swaps
5. **Feedback System** - After completion, both users can rate each other

### Admin Panel Features
- **Overview Dashboard** - Platform statistics and quick actions
- **User Management** - View, ban/unban users, manage accounts
- **Skill Moderation** - Approve/reject new skills with notes
- **Swap Monitoring** - View all swap requests and manage disputes
- **Platform Messages** - Create and manage system announcements
- **Analytics** - Generate reports and export data

### User Experience Features
- **Real-time Updates** - Live notifications for request status changes
- **Search & Filtering** - Find users by skills, location, availability
- **Responsive Design** - Optimized for desktop and mobile
- **Privacy Controls** - Public/private profile settings
- **Rating System** - Build reputation through feedback

## 📱 Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | User discovery with search and filtering |
| `/auth` | Authentication | Login and signup forms |
| `/browse` | Browse Users | Complete user listing |
| `/profile` | Profile Management | Edit profile and skills |
| `/requests` | Request Management | Incoming/outgoing swap requests |
| `/request/:profileId` | Send Request | Create new swap request |
| `/admin` | Admin Dashboard | Platform administration (admin only) |
| `/banned` | Banned Page | Restricted access page |

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Project Structure
```
src/
├── components/     # Reusable UI components
│   ├── ui/        # shadcn/ui components
│   ├── ProfileCard.tsx
│   ├── SkillSelector.tsx
│   └── Navigation.tsx
├── pages/         # Page components
│   ├── Home.tsx
│   ├── Auth.tsx
│   ├── Profile.tsx
│   ├── Requests.tsx
│   ├── Admin.tsx
│   └── ...
├── hooks/         # Custom React hooks
│   ├── use-auth.tsx
│   ├── use-banned-check.tsx
│   └── use-toast.ts
├── lib/           # Utility functions
│   ├── auth.tsx
│   ├── admin.ts
│   └── utils.ts
└── integrations/  # External services
    └── supabase/
        ├── client.ts
        └── types.ts
```

### Database Migrations
Database schema changes are managed through Supabase migrations in the `supabase/migrations/` directory. To apply migrations:

```bash
supabase db push
```

### Key Components

#### ProfileCard
- Displays user information with skills
- Shows ratings and location
- Handles swap request initiation

#### SkillSelector
- Search and select skills
- Create new skills (pending approval)
- Manage offered/wanted skills

#### Admin Panel
- Comprehensive admin dashboard
- User management and moderation
- Analytics and reporting

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform that supports static site hosting:
- **Netlify** - Connect repo and set build command: `npm run build`
- **GitHub Pages** - Use GitHub Actions for deployment
- **AWS S3 + CloudFront** - Static hosting with CDN
- **Firebase Hosting** - Google's hosting platform

### Environment Variables
Make sure to set these in your deployment platform:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint for code quality
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Contact the development team

## 🔮 Future Enhancements

- **Real-time Chat** - Direct messaging between users
- **Video Integration** - Video calls for skill sessions
- **Mobile App** - Native mobile application
- **Advanced Search** - More sophisticated filtering options
- **Skill Categories** - Organized skill taxonomy
- **Achievement System** - Badges and gamification
- **Calendar Integration** - Schedule skill sessions
- **Payment System** - Premium features and monetization
- **API Documentation** - Public API for integrations
- **Multi-language Support** - Internationalization

---

Built with ❤️ using modern web technologies
