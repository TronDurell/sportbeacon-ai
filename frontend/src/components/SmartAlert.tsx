import React from 'react';
import { motion } from 'framer-motion';
import { X, Bot } from 'lucide-react';

export interface SmartAlertAction {
  label: string;
  onClick: () => void;
  aiPrompt?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface SmartAlertProps {
  id: string;
  title: string;
  message: string;
  icon?: React.ReactNode;
  status?: 'info' | 'warning' | 'error' | 'success';
  onDismiss: (id: string) => void;
  actions?: SmartAlertAction[];
}

const statusColors = {
  info: 'border-blue-300 bg-blue-50',
  warning: 'border-yellow-300 bg-yellow-50',
  error: 'border-red-300 bg-red-50',
  success: 'border-green-300 bg-green-50',
};

const SmartAlert: React.FC<SmartAlertProps> = ({
  id,
  title,
  message,
  icon,
  status = 'info',
  onDismiss,
  actions = [],
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      layout
      className={`relative p-4 rounded-xl border shadow-md flex items-start gap-4 mb-3 ${statusColors[status]}`}
    >
      <div className="flex-shrink-0 mt-1">
        {icon || <Bot className="w-6 h-6 text-blue-500" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 text-base">{title}</h4>
          <button
            className="ml-2 p-1 rounded hover:bg-gray-200"
            onClick={() => onDismiss(id)}
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-700 mt-1 mb-2">{message}</p>
        {actions.length > 0 && (
          <div className="flex gap-2 mt-2">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors
                  ${action.variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                    action.variant === 'secondary' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' :
                    'text-blue-600 hover:bg-blue-50'}
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SmartAlert; 