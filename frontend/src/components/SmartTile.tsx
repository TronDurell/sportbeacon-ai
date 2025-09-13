import React from "react";
import { motion } from "framer-motion";
import { Bot, ExternalLink, ChevronRight } from "lucide-react";

interface SmartTileProps {
  title: string;
  icon?: React.ReactNode;
  status?: "success" | "warning" | "error" | "info" | "neutral";
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "ghost";
  }>;
  onClickAI?: () => void;
  children?: React.ReactNode;
  className?: string;
  loading?: boolean;
  href?: string;
}

const SmartTile: React.FC<SmartTileProps> = ({
  title,
  icon,
  status = "neutral",
  actions = [],
  onClickAI,
  children,
  className = "",
  loading = false,
  href
}) => {
  const statusColors = {
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    error: "border-red-200 bg-red-50",
    info: "border-blue-200 bg-blue-50",
    neutral: "border-gray-200 bg-white"
  };

  const statusIcons = {
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
    info: "text-blue-600",
    neutral: "text-gray-600"
  };

  const handleClick = () => {
    if (href) {
      window.open(href, "_blank");
    }
  };

  const TileContent = (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-6 rounded-xl border transition-all duration-200 cursor-pointer
        ${statusColors[status]}
        ${href ? "hover:shadow-md" : ""}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`p-2 rounded-lg bg-white/80 ${statusIcons[status]}`}>
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {status !== "neutral" && (
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  status === "success" ? "bg-green-500" :
                  status === "warning" ? "bg-yellow-500" :
                  status === "error" ? "bg-red-500" :
                  "bg-blue-500"
                }`} />
                <span className={`text-xs capitalize ${
                  status === "success" ? "text-green-700" :
                  status === "warning" ? "text-yellow-700" :
                  status === "error" ? "text-red-700" :
                  "text-blue-700"
                }`}>
                  {status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI Button */}
        {onClickAI && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onClickAI();
            }}
            className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            title="Get AI assistance"
          >
            <Bot className="w-4 h-4" />
          </motion.button>
        )}

        {/* External Link Indicator */}
        {href && (
          <ExternalLink className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        ) : (
          children
        )}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            {actions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className={`
                  px-3 py-1.5 text-sm rounded-md transition-colors
                  ${action.variant === "primary" 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : action.variant === "secondary"
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "text-blue-600 hover:bg-blue-50"
                  }
                `}
              >
                {action.label}
              </motion.button>
            ))}
          </div>
          
          {href && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      )}
    </motion.div>
  );

  return TileContent;
};

export default SmartTile; 