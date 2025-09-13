import React from "react";
import { Link, useLocation } from "react-router-dom";
import BaseLayout from "./BaseLayout";
import { 
  Home, 
  Users, 
  Trophy, 
  Settings, 
  BarChart3, 
  Shield,
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: Home },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Leagues", href: "/admin/leagues", icon: Trophy },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Reports", href: "/admin/reports", icon: FileText },
    { name: "Calendar", href: "/admin/calendar", icon: Calendar },
    { name: "Billing", href: "/admin/billing", icon: DollarSign },
    { name: "Security", href: "/admin/security", icon: Shield },
    { name: "Alerts", href: "/admin/alerts", icon: AlertTriangle },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const sidebarContent = (
    <nav className="space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  const headerContent = (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Admin Dashboard</h2>
        <p className="text-sm text-gray-600">System overview and management</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">1,234</p>
          <p className="text-xs text-gray-500">Total Users</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">45</p>
          <p className="text-xs text-gray-500">Active Leagues</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">156</p>
          <p className="text-xs text-gray-500">Total Teams</p>
        </div>
      </div>
    </div>
  );

  return (
    <BaseLayout
      sidebarContent={sidebarContent}
      headerContent={headerContent}
    >
      {children}
    </BaseLayout>
  );
};

export default AdminLayout; 