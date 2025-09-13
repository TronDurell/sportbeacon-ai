import React from 'react';
import { Loader2, AlertCircle, CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

// Loading Spinner Component
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}> = ({ size = 'md', className = '', text }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

// Loading Overlay Component
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
}> = ({ isLoading, text = 'Loading...', children }) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 font-medium">{text}</p>
        </div>
      </div>
    </div>
  );
};

// Error State Component
export const ErrorState: React.FC<{
  error: string | null;
  onRetry?: () => void;
  className?: string;
}> = ({ error, onRetry, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Success State Component
export const SuccessState: React.FC<{
  message: string;
  onDismiss?: () => void;
  className?: string;
}> = ({ message, onDismiss, className = '' }) => {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-800">Success</h3>
          <p className="text-sm text-green-700 mt-1">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-400 hover:text-green-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Warning State Component
export const WarningState: React.FC<{
  message: string;
  onAction?: () => void;
  actionText?: string;
  className?: string;
}> = ({ message, onAction, actionText, className = '' }) => {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
          <p className="text-sm text-yellow-700 mt-1">{message}</p>
          {onAction && actionText && (
            <button
              onClick={onAction}
              className="mt-3 inline-flex items-center px-3 py-1.5 border border-yellow-300 shadow-sm text-xs font-medium rounded text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              {actionText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Empty State Component
export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, description, icon, action, className = '' }) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && <div className="mx-auto w-12 h-12 text-gray-400 mb-4">{icon}</div>}
      <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

// Network Status Component
export const NetworkStatus: React.FC<{
  isOnline: boolean;
  className?: string;
}> = ({ isOnline, className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-700">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">Offline</span>
        </>
      )}
    </div>
  );
};

// Sync Status Component
export const SyncStatus: React.FC<{
  lastSync: Date | null;
  isSyncing?: boolean;
  className?: string;
}> = ({ lastSync, isSyncing = false, className = '' }) => {
  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isSyncing ? (
        <>
          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
          <span className="text-sm text-blue-700">Syncing...</span>
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-600">
            {lastSync ? `Last sync: ${formatLastSync(lastSync)}` : 'Never synced'}
          </span>
        </>
      )}
    </div>
  );
};

// Progress Bar Component
export const ProgressBar: React.FC<{
  progress: number; // 0-100
  text?: string;
  className?: string;
}> = ({ progress, text, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {text || 'Progress'}
        </span>
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Skeleton Loading Component
export const Skeleton: React.FC<{
  className?: string;
  lines?: number;
}> = ({ className = '', lines = 1 }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded mb-2"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
};

// Card Skeleton Component
export const CardSkeleton: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    </div>
  );
};

// Table Skeleton Component
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-3">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b border-gray-100 px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-gray-200 rounded flex-1"
                  style={{ width: colIndex === columns - 1 ? '60%' : '100%' }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading Button Component
export const LoadingButton: React.FC<{
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ 
  isLoading, 
  loadingText = 'Loading...', 
  children, 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {isLoading ? loadingText : children}
    </button>
  );
};

// Status Indicator Component
export const StatusIndicator: React.FC<{
  status: 'loading' | 'success' | 'error' | 'warning' | 'idle';
  text?: string;
  className?: string;
}> = ({ status, text, className = '' }) => {
  const statusConfig = {
    loading: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    success: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50' },
    error: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
    warning: { icon: AlertCircle, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    idle: { icon: CheckCircle, color: 'text-gray-500', bgColor: 'bg-gray-50' }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Icon className={`w-4 h-4 ${config.color} ${status === 'loading' ? 'animate-spin' : ''}`} />
      {text && <span className={`text-sm ${config.color}`}>{text}</span>}
    </div>
  );
};

export { LoadingStates }; 