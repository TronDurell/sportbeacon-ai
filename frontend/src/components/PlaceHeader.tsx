import React from "react";
import { Location } from "../types";

interface PlaceHeaderProps {
  location: Location;
}

export const PlaceHeader: React.FC<PlaceHeaderProps> = ({ location }) => {
  const getSportIcon = (sport: string) => {
    switch (sport) {
      case "basketball": return "🏀";
      case "soccer": return "⚽";
      case "tennis": return "🎾";
      case "pickleball": return "🏓";
      case "baseball": return "⚾";
      case "volleyball": return "🏐";
      default: return "🏟️";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "text-green-600 bg-green-100";
      case "closed": return "text-red-600 bg-red-100";
      case "limited": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-4xl">{getSportIcon(location.sport)}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{location.name}</h1>
                <p className="text-gray-600">{location.address}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <span>{location.city}, {location.state}</span>
              {location.hours && (
                <span>• {JSON.stringify(location.hours)}</span>
              )}
            </div>

            {/* Amenities */}
            {location.amenities && location.amenities.length > 0 && (
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm font-medium text-gray-700">Amenities:</span>
                <div className="flex space-x-1">
                  {location.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {amenity === "lights" && "💡"}
                      {amenity === "restrooms" && "🚻"}
                      {amenity === "parking" && "🅿️"}
                      {amenity === "water" && "💧"}
                      {amenity === "shade" && "🌳"}
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Followers:</span>
                <span className="font-semibold text-gray-900">{location.stats.followers}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Posts:</span>
                <span className="font-semibold text-gray-900">{location.stats.posts}</span>
              </div>
              {location.stats.lastPostAt && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Last post:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(location.stats.lastPostAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="ml-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(location.status)}`}>
              {location.status === "open" && "🟢"}
              {location.status === "closed" && "🔴"}
              {location.status === "limited" && "🟡"}
              <span className="ml-1 capitalize">{location.status}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
