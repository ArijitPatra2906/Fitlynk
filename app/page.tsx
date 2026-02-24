export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-dark-background">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-dark-text-primary">Fitlynk</h1>
        </div>

        <p className="text-dark-text-secondary text-center text-xl">
          Your fitness, unified. Coming soon...
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full">
          <div className="bg-dark-surface p-6 rounded-card border border-dark-border">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-dark-text-primary mb-2">Exercise Tracker</h3>
            <p className="text-dark-text-secondary text-sm">
              Log workouts, track progress, and crush your fitness goals
            </p>
          </div>

          <div className="bg-dark-surface p-6 rounded-card border border-dark-border">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-dark-text-primary mb-2">Nutrition Tracker</h3>
            <p className="text-dark-text-secondary text-sm">
              Log meals, scan barcodes, and hit your macro targets
            </p>
          </div>

          <div className="bg-dark-surface p-6 rounded-card border border-dark-border">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-dark-text-primary mb-2">Progress Tracking</h3>
            <p className="text-dark-text-secondary text-sm">
              Visualize your journey with charts and metrics
            </p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-dark-text-secondary text-sm">
            Built with Next.js 14 + Capacitor + MongoDB
          </p>
        </div>
      </div>
    </main>
  );
}
