import React, { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className={cn(
      'main-content-area flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900',
      'w-full max-w-full overflow-x-hidden',
      className
    )}>
      {children}
    </div>
  );
};

export default Layout;
