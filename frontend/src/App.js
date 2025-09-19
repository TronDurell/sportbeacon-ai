import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy, useEffect } from "react";
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
const LoadingSpinner = () => (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" }) }));
function App() {
    // Initialize memory SDK for session tracking (disabled for now to prevent NO_FCP)
    const { captureSessionStart } = useMemory({ enabled: false, autoCapture: false });
    useEffect(() => {
        // Initialize Web Vitals monitoring
        webVitalsReporter.initialize();
    }, []);
    return (_jsx(ErrorBoundaryWithMonitoring, { children: _jsx(Router, { children: _jsxs("div", { className: "App", children: [_jsx("nav", { className: "bg-gray-800 text-white p-4", children: _jsx("div", { className: "container mx-auto", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-bold", children: "SportBeacon AI" }), _jsxs("div", { className: "flex space-x-4", children: [_jsx(Link, { to: "/", className: "hover:text-gray-300 transition-colors", children: "Health" }), _jsx(Link, { to: "/insights", className: "hover:text-gray-300 transition-colors", children: "Insights" }), _jsx(Link, { to: "/drills", className: "hover:text-gray-300 transition-colors", children: "Drills" }), _jsx(Link, { to: "/matchmaking", className: "hover:text-gray-300 transition-colors", children: "Matchmaking" }), _jsx(Link, { to: "/winners", className: "hover:text-gray-300 transition-colors", children: "Winners" }), _jsx(Link, { to: "/places/godbold-park-court-2", className: "hover:text-gray-300 transition-colors", children: "Places" })] })] }) }) }), _jsx("main", { children: _jsx(Suspense, { fallback: _jsx(LoadingSpinner, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Health, {}) }), _jsx(Route, { path: "/insights", element: _jsx(Insights, {}) }), _jsx(Route, { path: "/drills", element: _jsx(Drills, {}) }), _jsx(Route, { path: "/matchmaking", element: _jsx(Matchmaking, {}) }), _jsx(Route, { path: "/winners", element: _jsx(Winners, {}) }), _jsx(Route, { path: "/places/:locationId", element: _jsx(PlaceProfile, {}) })] }) }) }), _jsx(PWAInstallPrompt, {})] }) }) }));
}
export default App;
