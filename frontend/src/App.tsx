import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import ErrorBoundaryWithMonitoring from "./components/ErrorBoundaryWithMonitoring";
import webVitalsReporter from "./lib/webVitals";
import { useMemory } from "./hooks/useMemory";
import "./App.css";

// Lazy load pages for code splitting
const Health = lazy(() => import("./pages/Health"));
const Insights = lazy(() => import("./pages/Insights"));
const Drills = lazy(() => import("./pages/Drills"));
const Matchmaking = lazy(() => import("./pages/Matchmaking"));
const Winners = lazy(() => import("./pages/Winners"));
const PlaceProfile = lazy(() => import("./pages/PlaceProfile"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  // Initialize memory SDK for session tracking (disabled for now to prevent NO_FCP)
  const { captureSessionStart } = useMemory({ enabled: false, autoCapture: false });

  useEffect(() => {
    // Initialize Web Vitals monitoring
    webVitalsReporter.initialize();
  }, []);

  return (
    <ErrorBoundaryWithMonitoring>
      <Router>
        <div className="App">
        {/* Navigation */}
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">SportBeacon AI</h1>
              <div className="flex space-x-4">
                <Link to="/" className="hover:text-gray-300 transition-colors">
                  Health
                </Link>
                <Link to="/insights" className="hover:text-gray-300 transition-colors">
                  Insights
                </Link>
                <Link to="/drills" className="hover:text-gray-300 transition-colors">
                  Drills
                </Link>
                <Link to="/matchmaking" className="hover:text-gray-300 transition-colors">
                  Matchmaking
                </Link>
                <Link to="/winners" className="hover:text-gray-300 transition-colors">
                  Winners
                </Link>
                <Link to="/places/godbold-park-court-2" className="hover:text-gray-300 transition-colors">
                  Places
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <main>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Health />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/drills" element={<Drills />} />
              <Route path="/matchmaking" element={<Matchmaking />} />
              <Route path="/winners" element={<Winners />} />
              <Route path="/places/:locationId" element={<PlaceProfile />} />
            </Routes>
          </Suspense>
        </main>

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
        </div>
      </Router>
    </ErrorBoundaryWithMonitoring>
  );
}

export default App; 