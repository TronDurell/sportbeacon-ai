import React from "react";
import { FileText, BarChart3, Calendar } from "lucide-react";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";

interface Report {
  id: string;
  title: string;
  type: "performance" | "attendance" | "financial" | "analytics";
  generatedDate: Date;
  status: "ready" | "generating" | "failed";
  size: string;
  format: "pdf" | "csv" | "excel";
}

const Reports: React.FC = () => {
  const { sendRequest } = useAgentOrchestration();

  const reports: Report[] = [
    {
      id: "1",
      title: "Monthly Performance Report",
      type: "performance",
      generatedDate: new Date("2024-01-20"),
      status: "ready",
      size: "2.3 MB",
      format: "pdf"
    },
    {
      id: "2",
      title: "Attendance Summary",
      type: "attendance",
      generatedDate: new Date("2024-01-19"),
      status: "ready",
      size: "1.1 MB",
      format: "csv"
    },
    {
      id: "3",
      title: "Financial Overview",
      type: "financial",
      generatedDate: new Date("2024-01-18"),
      status: "ready",
      size: "3.7 MB",
      format: "excel"
    },
    {
      id: "4",
      title: "Team Analytics",
      type: "analytics",
      generatedDate: new Date("2024-01-17"),
      status: "generating",
      size: "--",
      format: "pdf"
    }
  ];

  const getTypeColor = (type: Report["type"]) => {
    switch (type) {
      case "performance": return "bg-blue-100 text-blue-800";
      case "attendance": return "bg-green-100 text-green-800";
      case "financial": return "bg-purple-100 text-purple-800";
      case "analytics": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: Report["status"]) => {
    switch (status) {
      case "ready": return "text-green-600";
      case "generating": return "text-yellow-600";
      case "failed": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getFormatIcon = (format: Report["format"]) => {
    switch (format) {
      case "pdf": return "📄";
      case "csv": return "📊";
      case "excel": return "📈";
      default: return "📄";
    }
  };

  const generateReport = async (type: Report["type"]) => {
    await sendRequest({
      type: "generate_report",
      reportType: type,
      timestamp: new Date()
    });
  };

  const downloadReport = async (reportId: string) => {
    await sendRequest({
      type: "download_report",
      reportId
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => generateReport("performance")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ready</p>
              <p className="text-2xl font-bold text-green-600">
                {reports.filter(r => r.status === "ready").length}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Generating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {reports.filter(r => r.status === "generating").length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {reports.filter(r => r.status === "failed").length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getFormatIcon(report.format)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.format.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(report.type)}`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.generatedDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {report.status === "ready" ? (
                      <button
                        onClick={() => downloadReport(report.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Download
                      </button>
                    ) : (
                      <span className="text-gray-400">Not available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports; 