import React from "react";

interface SkeletonLoaderProps {
  type?: "text" | "card" | "feed" | "image";
  className?: string;
  lines?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = "text", 
  className = "", 
  lines = 1 
}) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";

  const renderSkeleton = () => {
    switch (type) {
      case "text":
        return (
          <div className={`${baseClasses} h-4 ${className}`}></div>
        );
      
      case "card":
        return (
          <div className={`${baseClasses} p-4 ${className}`}>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        );
      
      case "feed":
        return (
          <div className={`${baseClasses} p-4 mb-4 ${className}`}>
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1 w-1/3"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6"></div>
            </div>
          </div>
        );
      
      case "image":
        return (
          <div className={`${baseClasses} aspect-video ${className}`}></div>
        );
      
      default:
        return (
          <div className={`${baseClasses} h-4 ${className}`}></div>
        );
    }
  };

  if (type === "text" && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} h-4 ${index === lines - 1 ? "w-3/4" : ""} ${className}`}
          ></div>
        ))}
      </div>
    );
  }

  return renderSkeleton();
};

export default SkeletonLoader;
