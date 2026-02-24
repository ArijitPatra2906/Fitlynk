# Fitlynk - Personal Fitness & Diet Tracker

A cross-platform personal fitness and diet tracking application built with Next.js and Capacitor. Delivers a native-quality experience on iOS, Android, and web from a single codebase.

## Features

- **Exercise Tracker**: Log workouts, track sets/reps/weight, monitor progress
- **Nutrition Tracker**: Log meals, scan barcodes, track macros
- **Progress Tracking**: Visualize your journey with charts and metrics
- **Body Metrics**: Track weight, measurements, and body composition
- **Cross-Platform**: Works on iOS, Android, and Web

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3 + shadcn/ui
- **Database**: MongoDB + Mongoose
- **Authentication**: NextAuth.js
- **State Management**: Zustand + TanStack Query
- **Charts**: Recharts
- **Mobile**: Capacitor 6
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 20.19+ (recommended)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd fitlynk-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your MongoDB connection string and other required variables.

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
fitlynk-app/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes
│   ├── (dashboard)/         # Protected dashboard routes
│   ├── api/                 # API routes
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── db/                  # MongoDB connection & models
│   ├── hooks/               # Custom React hooks
│   └── utils/               # Utility functions
├── store/                   # Zustand stores
├── types/                   # TypeScript types
├── public/                  # Static assets
└── capacitor.config.ts      # Capacitor configuration
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Database Models

The app uses the following MongoDB collections:

- **users**: User profiles and authentication
- **goals**: User fitness goals and macro targets
- **workouts**: Workout sessions
- **exercises**: Exercise library
- **meal_logs**: Meal entries
- **foods**: Food database
- **body_metrics**: Weight and measurements
- **water_logs**: Hydration tracking

### Adding shadcn/ui Components

To add shadcn/ui components:

```bash
npx shadcn@latest add <component-name>
```

For example:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
```

## Mobile Development with Capacitor

### Setup Capacitor

1. Install Capacitor CLI:
```bash
npm install @capacitor/cli @capacitor/core
```

2. Initialize Capacitor:
```bash
npx cap init
```

3. Add iOS and Android platforms:
```bash
npx cap add ios
npx cap add android
```

4. Build the web app and sync to native platforms:
```bash
npm run build
npx cap sync
```

5. Open in native IDEs:
```bash
npx cap open ios
npx cap open android
```

### Required Capacitor Plugins

The following plugins are already included in package.json:

- `@capacitor/camera` - Photo capture & barcode scanning
- `@capacitor/preferences` - Secure storage
- `@capacitor/local-notifications` - Push notifications
- `@capacitor/filesystem` - File operations
- `@capacitor/haptics` - Haptic feedback
- `@capacitor-community/barcode-scanner` - Barcode scanning

## API Integration

### Open Food Facts API

Used for food database and barcode lookups. No API key required.

```typescript
const response = await fetch(
  `https://world.openfoodfacts.org/api/v2/product/${barcode}`
);
```

### USDA FoodData Central

Used for additional nutrition data. Requires free API key.

Sign up at: https://fdc.nal.usda.gov/api-key-signup.html

## Authentication

The app uses NextAuth.js with support for:

- Email/Password authentication
- Google OAuth
- Apple OAuth
- Magic Link (passwordless)

Configure OAuth providers in `.env.local`:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
```

## Deployment

### Web (Vercel)

The easiest way to deploy is using Vercel:

```bash
npm run build
vercel --prod
```

### iOS App Store

1. Build the web app: `npm run build`
2. Sync to iOS: `npx cap sync ios`
3. Open Xcode: `npx cap open ios`
4. Configure signing & provisioning
5. Archive and upload to App Store Connect

### Google Play Store

1. Build the web app: `npm run build`
2. Sync to Android: `npx cap sync android`
3. Open Android Studio: `npx cap open android`
4. Build signed APK/AAB
5. Upload to Google Play Console

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT

## Credits

Built with ❤️ using:
- [Next.js](https://nextjs.org/)
- [Capacitor](https://capacitorjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [MongoDB](https://www.mongodb.com/)
- [NextAuth.js](https://next-auth.js.org/)

## Roadmap

See [FEATURE_TRACKING.md](../FEATURE_TRACKING.md) for detailed feature status and development roadmap.

### Phase 0 (Weeks 1-2) - ✅ In Progress
- [x] Project setup
- [x] Next.js + TypeScript configuration
- [x] Tailwind CSS + shadcn/ui
- [x] MongoDB connection
- [ ] Capacitor initialization
- [ ] Design system implementation

### Phase 1 (Weeks 3-5) - Coming Soon
- Authentication UI
- Onboarding flow
- Home dashboard
- Bottom navigation
- Profile & settings

### Phase 2 (Weeks 6-9)
- Exercise tracking module
- Workout templates
- Exercise library
- Progress charts

### Phase 3 (Weeks 10-13)
- Nutrition tracking module
- Food search & barcode scanning
- Meal logging
- Macro dashboard

### Phase 4 (Weeks 14-16)
- Body metrics tracking
- Weight trends
- TDEE calculator
- Goal management

### Phase 5 (Weeks 17-18)
- Offline support
- Performance optimization
- Accessibility audit
- TestFlight & Play Store testing

## Contact

For questions or feedback, please open an issue on GitHub.
