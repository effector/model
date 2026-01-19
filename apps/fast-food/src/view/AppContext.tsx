import React, { createContext, useContext, ReactNode } from 'react';
import { AppInstance } from '../models/app';

const AppContext = createContext<AppInstance | null>(null);

export const AppProvider = ({
  app,
  children,
}: {
  app: AppInstance;
  children: ReactNode;
}) => {
  return <AppContext.Provider value={app}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
