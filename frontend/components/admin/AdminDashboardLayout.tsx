import React, { ReactNode, useState } from 'react';
import { Button } from 'shadcn/ui/button';

const navItems = [
  { label: 'Leagues', path: '/admin/leagues' },
  { label: 'Teams', path: '/admin/teams' },
  { label: 'Schedule', path: '/admin/schedule' },
  { label: 'Registrations', path: '/admin/registrations' },
  { label: 'Reports', path: '/admin/reports' },
  { label: 'Broadcast', path: '/admin/broadcast' },
];

const AdminDashboardLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col" role="region" aria-label="Admin dashboard layout" tabIndex={0}>
      <nav className={`fixed z-30 inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform md:translate-x-0 md:static md:shadow-none`} aria-label="Sidebar">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-bold text-lg">Town Rec Admin</span>
            <Button className="md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">×</Button>
          </div>
          <ul className="flex-1 p-4 space-y-2">
            {navItems.map(item => (
              <li key={item.path}>
                <a href={item.path} className="block px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500">{item.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 shadow md:hidden">
          <Button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">☰</Button>
          <span className="font-bold">Town Rec Admin</span>
        </header>
        <main className="flex-1 p-4 md:ml-64">{children}</main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout; 