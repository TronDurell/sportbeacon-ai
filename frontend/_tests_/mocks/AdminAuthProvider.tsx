import React from 'react';

export const AdminAuthContext = React.createContext({ 
  isAdmin: true,
  user: null,
  loading: false 
});

export const AdminAuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <AdminAuthContext.Provider value={{ isAdmin: true, user: null, loading: false }}>
    {children}
  </AdminAuthContext.Provider>
);
