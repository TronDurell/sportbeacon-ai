import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Video, Play, Download, Share } from "lucide-react";

const VideoAnalysis: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Video Analysis</h1>
        <p className="text-gray-600">Review game footage and performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Video className="h-8 w-8 text-blue-500" />
                  <div className="flex-1">
                    <h3 className="font-medium">vs Central High</h3>
                    <p className="text-sm text-gray-600">January 15, 2024</p>
                  </div>
                  <Play className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Video className="h-8 w-8 text-blue-500" />
                  <div className="flex-1">
                    <h3 className="font-medium">vs East High</h3>
                    <p className="text-sm text-gray-600">January 12, 2024</p>
                  </div>
                  <Play className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Play className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium">Playback</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Download className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium">Download</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Share className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm font-medium">Share</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Video className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-sm font-medium">Analyze</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoAnalysis; 