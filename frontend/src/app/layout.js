import { jsx as _jsx } from "react/jsx-runtime";
import { Providers } from "../providers/RootProviders";
import "./globals.css";
export const metadata = {
    title: "SportBeacon AI - Intelligent Sports Management",
    description: "AI-powered sports management platform for coaches, players, and organizations",
};
export default function RootLayout({ children, }) {
    return (_jsx("html", { lang: "en", children: _jsx("body", { className: "antialiased bg-gray-50", children: _jsx(Providers, { children: children }) }) }));
}
