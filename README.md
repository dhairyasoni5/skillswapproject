# Swap Hub Connect

A modern web application for connecting users to swap and trade items. Built with React, TypeScript, and Supabase for a seamless user experience.

## 🚀 Features

- **User Authentication** - Secure login and registration system
- **Browse Items** - Discover items available for swapping
- **Request Swaps** - Initiate swap requests with other users
- **Profile Management** - Manage your profile and item listings
- **Admin Panel** - Administrative tools for platform management
- **Real-time Updates** - Live notifications and updates
- **Responsive Design** - Works seamlessly across all devices

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation

### UI/UX
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide React** - Beautiful icons
- **Sonner** - Toast notifications
- **Next Themes** - Dark/light mode support

### Backend
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Supabase Auth** - Authentication and authorization
- **PostgreSQL** - Database

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or bun package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd swap-hub-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to see the application.

## 🏗️ Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and configurations
├── integrations/  # Third-party integrations
└── App.tsx        # Main application component
```

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Development

### Code Style
This project uses ESLint for code linting and TypeScript for type safety. Make sure to run the linter before committing:

```bash
npm run lint
```

### Database Migrations
The project uses Supabase for database management. Database migrations are stored in the `supabase/migrations/` directory.

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

### Manual Deployment
1. Build the project: `npm run build`
2. Upload the `dist` folder to your web server
3. Configure your server to serve the static files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🔗 Links

- [Live Demo](https://your-demo-url.com)
- [Documentation](https://your-docs-url.com)
- [API Reference](https://your-api-docs-url.com)

---

Built with ❤️ using modern web technologies
