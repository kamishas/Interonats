# HR Platform - Project Structure

## 🏗️ Enterprise-Level Architecture

This project follows a clean, organized, and professional codebase structure designed for enterprise applications.

## 📁 Directory Structure

```
/
├── src/
│   ├── api/                      # 🔌 API Layer - All external API calls
│   │   ├── email-agent-api.ts    # Email Agent API endpoints
│   │   └── resume-api.ts         # Resume Management API endpoints
│   │
│   ├── lib/                      # 🛠️ Core Libraries & Utilities
│   │   ├── supabase.ts           # Supabase client configuration
│   │   └── auth-context.tsx      # Authentication context provider
│   │
│   ├── app/
│   │   ├── components/           # ⚛️ React Components
│   │   │   ├── ui/              # Reusable UI components (buttons, cards, etc.)
│   │   │   ├── login-page.tsx   # Login page component
│   │   │   ├── dashboard-page.tsx # Main dashboard
│   │   │   ├── resume-management.tsx # Resume module
│   │   │   ├── email-agent.tsx  # Email agent module
│   │   │   ├── resume-preview-dialog.tsx
│   │   │   ├── rich-text-editor.tsx
│   │   │   └── protected-route.tsx # Route protection wrapper
│   │   │
│   │   ├── routes.tsx           # Application routing configuration
│   │   └── App.tsx              # Root application component
│   │
│   └── styles/                  # 🎨 Global Styles
│       ├── index.css
│       ├── tailwind.css
│       └── theme.css
│
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies
└── vite.config.ts              # Vite configuration
```

## 🔑 Key Features

### 1. **Separation of Concerns**
- **API Layer** (`/src/api/`): All API calls are centralized in dedicated modules
- **Business Logic** (`/src/lib/`): Core functionality and utilities
- **Presentation** (`/src/app/components/`): React components for UI

### 2. **Authentication System**
- Supabase-powered authentication
- Protected routes with automatic redirects
- User session management
- Sign in / Sign up functionality

### 3. **Module Organization**

#### Resume Management Module
- Upload and manage candidate resumes
- Advanced filtering (status, visa status, search)
- Resume preview dialog
- Status tracking (new, reviewed, interviewing, hired, rejected)

#### Email Agent Module
- Compose and send emails to multiple recipients
- Campaign management
- Contact management
- Email delivery tracking
- Category-based organization

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```

### 3. Set Up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Add them to your `.env` file

### 4. Run Development Server
```bash
npm run dev
```

## 🔐 Supabase Setup

### Required Tables

Create these tables in your Supabase project:

```sql
-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own data"
  on public.users for update
  using (auth.uid() = id);
```

## 🎨 Styling

The application uses:
- **Tailwind CSS v4** for utility-first styling
- **shadcn/ui** components for consistent UI
- Gradient backgrounds and modern glass-morphism effects
- Responsive design for mobile and desktop

## 📦 Key Dependencies

- **React Router** - Client-side routing
- **Supabase** - Authentication and database
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon system
- **Sonner** - Toast notifications
- **Recharts** - Data visualization

## 🏢 API Integration

### Email Agent API
Base URL: `https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod`

Endpoints:
- `POST /campaigns` - Create campaign
- `GET /campaigns` - List campaigns
- `POST /contacts` - Add contact
- `GET /contacts` - List contacts
- `POST /compliance/text` - Check EEOC compliance
- `POST /images` - Upload and verify images

### Resume API
Currently using localStorage for demonstration. Can be easily swapped with a real API backend.

## 🔒 Security Best Practices

1. **Environment Variables**: All sensitive data in `.env` files
2. **Row Level Security**: Supabase RLS policies protect data
3. **Protected Routes**: Authentication required for dashboard access
4. **API Keys**: Never committed to version control

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-friendly interactions
- Optimized layouts for all screen sizes

## 🎯 Best Practices Implemented

- ✅ Clean separation of API, business logic, and UI
- ✅ TypeScript for type safety
- ✅ Centralized state management
- ✅ Reusable component architecture
- ✅ Professional SaaS UI/UX patterns
- ✅ Comprehensive error handling
- ✅ Loading states and user feedback
- ✅ Accessibility considerations

## 🔄 Development Workflow

1. **API Changes**: Update files in `/src/api/`
2. **UI Changes**: Modify components in `/src/app/components/`
3. **Auth Changes**: Update `/src/lib/auth-context.tsx`
4. **Routing**: Edit `/src/app/routes.tsx`
5. **Styling**: Modify Tailwind classes or `/src/styles/theme.css`

## 📈 Future Enhancements

- Real-time notifications
- Advanced analytics dashboard
- File upload to cloud storage
- Email templates library
- Calendar integration for interviews
- Candidate pipeline management
- Team collaboration features

## 🤝 Contributing

This is an enterprise-level codebase. When contributing:
1. Follow the existing folder structure
2. Keep API calls in the `/src/api/` directory
3. Use TypeScript types
4. Add JSDoc comments for complex functions
5. Test thoroughly before committing

## 📄 License

Proprietary - All Rights Reserved
