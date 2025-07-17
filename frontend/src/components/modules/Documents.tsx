import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FileText, Download, Upload, CheckCircle } from 'lucide-react';

const Documents: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600">Upload and manage important documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <input type="file" className="flex-1" />
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Medical Form.pdf</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <button className="ml-auto text-blue-600 hover:underline flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Waiver.pdf</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <button className="ml-auto text-blue-600 hover:underline flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Documents; 