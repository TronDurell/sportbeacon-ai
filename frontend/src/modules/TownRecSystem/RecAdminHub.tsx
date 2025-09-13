import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AdminAuthContext";
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  BarChart3,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Star,
  TrendingUp,
  Shield,
  Lock
} from "lucide-react";

interface WaitlistEntry {
  id: string;
  childName: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  league: string;
  ageGroup: string;
  registrationDate: Date;
  waitlistPosition: number;
  priority: "high" | "medium" | "low";
  status: "waiting" | "promoted" | "declined" | "expired";
  notes?: string;
}

interface SiblingPairing {
  id: string;
  familyId: string;
  parentName: string;
  parentEmail: string;
  children: Array<{
    name: string;
    age: number;
    league: string;
    team?: string;
  }>;
  status: "pending" | "paired" | "conflict" | "manual_review";
  requestedLeague?: string;
  notes?: string;
}

interface AgeOverride {
  id: string;
  childName: string;
  parentName: string;
  parentEmail: string;
  currentAge: number;
  requestedLeague: string;
  ageRequirement: number;
  reason: string;
  requestedBy: string;
  status: "pending" | "approved" | "denied";
  directorNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DirectorApproval {
  id: string;
  type: "age_override" | "sibling_pairing" | "waitlist_promotion" | "league_transfer";
  title: string;
  description: string;
  requester: string;
  requesterEmail: string;
  status: "pending" | "approved" | "denied";
  createdAt: Date;
  priority: "high" | "medium" | "low";
  attachments?: string[];
}

interface RecAnalytics {
  totalRegistrations: number;
  waitlistCount: number;
  pendingApprovals: number;
  siblingPairings: number;
  ageOverrides: number;
  leagueCapacity: Record<string, number>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    user: string;
  }>;
}

const RecAdminHub: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"waitlists" | "siblings" | "overrides" | "approvals" | "analytics">("waitlists");
  const [waitlistData, setWaitlistData] = useState<WaitlistEntry[]>([]);
  const [siblingData, setSiblingData] = useState<SiblingPairing[]>([]);
  const [overrideData, setOverrideData] = useState<AgeOverride[]>([]);
  const [approvalData, setApprovalData] = useState<DirectorApproval[]>([]);
  const [analytics, setAnalytics] = useState<RecAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Mock data for development
  useEffect(() => {
    const loadMockData = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock waitlist data
      setWaitlistData([
        {
          id: "1",
          childName: "Emma Johnson",
          parentName: "Sarah Johnson",
          parentEmail: "sarah.johnson@email.com",
          parentPhone: "(919) 555-0123",
          league: "Youth Soccer",
          ageGroup: "U10",
          registrationDate: new Date("2024-01-15"),
          waitlistPosition: 1,
          priority: "high",
          status: "waiting",
          notes: "Previous participant, excellent attendance"
        },
        {
          id: "2",
          childName: "Michael Chen",
          parentName: "David Chen",
          parentEmail: "david.chen@email.com",
          parentPhone: "(919) 555-0456",
          league: "Youth Basketball",
          ageGroup: "U12",
          registrationDate: new Date("2024-01-20"),
          waitlistPosition: 3,
          priority: "medium",
          status: "waiting"
        }
      ]);

      // Mock sibling pairing data
      setSiblingData([
        {
          id: "1",
          familyId: "fam_001",
          parentName: "Jennifer Smith",
          parentEmail: "jennifer.smith@email.com",
          children: [
            { name: "Alex Smith", age: 10, league: "Youth Soccer" },
            { name: "Jordan Smith", age: 8, league: "Youth Soccer" }
          ],
          status: "paired",
          requestedLeague: "Youth Soccer",
          notes: "Both children assigned to same team"
        }
      ]);

      // Mock age override data
      setOverrideData([
        {
          id: "1",
          childName: "Riley Thompson",
          parentName: "Mark Thompson",
          parentEmail: "mark.thompson@email.com",
          currentAge: 9,
          requestedLeague: "Youth Soccer U10",
          ageRequirement: 10,
          reason: "Child is advanced for age, previous experience in older leagues",
          requestedBy: "mark.thompson@email.com",
          status: "pending",
          createdAt: new Date("2024-01-25"),
          updatedAt: new Date("2024-01-25")
        }
      ]);

      // Mock approval data
      setApprovalData([
        {
          id: "1",
          type: "age_override",
          title: "Age Override Request - Riley Thompson",
          description: "Request to allow 9-year-old in U10 soccer league",
          requester: "Mark Thompson",
          requesterEmail: "mark.thompson@email.com",
          status: "pending",
          createdAt: new Date("2024-01-25"),
          priority: "medium"
        }
      ]);

      // Mock analytics data
      setAnalytics({
        totalRegistrations: 245,
        waitlistCount: 18,
        pendingApprovals: 3,
        siblingPairings: 12,
        ageOverrides: 5,
        leagueCapacity: {
          "Youth Soccer U8": 85,
          "Youth Soccer U10": 92,
          "Youth Soccer U12": 78,
          "Youth Basketball U10": 88,
          "Youth Basketball U12": 76
        },
        recentActivity: [
          {
            id: "1",
            type: "waitlist_promotion",
            description: "Emma Johnson promoted from waitlist to Youth Soccer U10",
            timestamp: new Date("2024-01-26T10:30:00"),
            user: "sarah.johnson@email.com"
          },
          {
            id: "2",
            type: "age_override_approved",
            description: "Age override approved for Riley Thompson",
            timestamp: new Date("2024-01-26T09:15:00"),
            user: "rec.director@cary.gov"
          }
        ]
      });

      setLoading(false);
    };

    loadMockData();
  }, []);

  const tabs = [
    { id: "waitlists", label: "Waitlists", icon: Clock, count: waitlistData.length },
    { id: "siblings", label: "Sibling Pairing", icon: Users, count: siblingData.length },
    { id: "overrides", label: "Age Overrides", icon: AlertTriangle, count: overrideData.length },
    { id: "approvals", label: "Director Approvals", icon: Shield, count: approvalData.filter(a => a.status === "pending").length },
    { id: "analytics", label: "Analytics", icon: BarChart3, count: null }
  ];

  const handlePromoteFromWaitlist = (entryId: string) => {
    // TODO: Implement waitlist promotion logic
    // Log waitlist promotion for audit trail
  };

  const handleApproveOverride = (overrideId: string) => {
    // TODO: Implement age override approval logic
    // Log age override approval for audit trail
  };

  const handleExportData = (type: string) => {
    // TODO: Implement CSV export logic
    // Log data export for audit trail
  };

  const filteredWaitlistData = waitlistData.filter(entry =>
    entry.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.league.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if user has Town Staff role
  if (!user || user.role !== "TownStaff" as any) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need Town Staff permissions to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading Town Rec Admin Hub...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Town Rec Admin Hub</h1>
            <p className="text-gray-600 mt-1">Manage Cary Parks & Recreation sports programs</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              New Registration
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== null && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or league..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="waiting">Waiting</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
        </div>
        <button
          onClick={() => handleExportData(activeTab)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "waitlists" && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Waitlist Management</h2>
                <p className="text-sm text-gray-600 mt-1">Manage registration waitlists and promote participants</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        League
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWaitlistData.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{entry.childName}</div>
                            <div className="text-sm text-gray-500">{entry.parentName}</div>
                            <div className="text-sm text-gray-400">{entry.parentEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.league}</div>
                          <div className="text-sm text-gray-500">{entry.ageGroup}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            #{entry.waitlistPosition}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.status === "waiting" ? "bg-yellow-100 text-yellow-800" :
                            entry.status === "promoted" ? "bg-green-100 text-green-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePromoteFromWaitlist(entry.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "siblings" && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Sibling Pairing Management</h2>
                <p className="text-sm text-gray-600 mt-1">Manage sibling pairing requests and team assignments</p>
              </div>
              <div className="p-6">
                {siblingData.map((pairing) => (
                  <div key={pairing.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{pairing.parentName}</h3>
                        <p className="text-sm text-gray-500">{pairing.parentEmail}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pairing.status === "paired" ? "bg-green-100 text-green-800" :
                        pairing.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {pairing.status.replace("_", " ").charAt(0).toUpperCase() + pairing.status.slice(1)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {pairing.children.map((child, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm font-medium">{child.name} (Age {child.age})</span>
                          <span className="text-sm text-gray-600">{child.league}</span>
                        </div>
                      ))}
                    </div>
                    {pairing.notes && (
                      <p className="text-sm text-gray-600 mt-3">{pairing.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "overrides" && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Age Override Management</h2>
                <p className="text-sm text-gray-600 mt-1">Review and approve age bracket exceptions</p>
              </div>
              <div className="p-6">
                {overrideData.map((override) => (
                  <div key={override.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{override.childName}</h3>
                        <p className="text-sm text-gray-500">{override.parentName} • {override.parentEmail}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        override.status === "approved" ? "bg-green-100 text-green-800" :
                        override.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {override.status.charAt(0).toUpperCase() + override.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Current Age:</span>
                        <span className="ml-2 text-sm text-gray-900">{override.currentAge}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Requested League:</span>
                        <span className="ml-2 text-sm text-gray-900">{override.requestedLeague}</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Reason:</span>
                      <p className="text-sm text-gray-900 mt-1">{override.reason}</p>
                    </div>
                    {override.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveOverride(override.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                          Deny
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "approvals" && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Director Approvals</h2>
                <p className="text-sm text-gray-600 mt-1">Review pending approval requests</p>
              </div>
              <div className="p-6">
                {approvalData.map((approval) => (
                  <div key={approval.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{approval.title}</h3>
                        <p className="text-sm text-gray-500">{approval.requester} • {approval.requesterEmail}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        approval.status === "approved" ? "bg-green-100 text-green-800" :
                        approval.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{approval.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Requested: {approval.createdAt.toLocaleDateString()}
                      </span>
                      {approval.status === "pending" && (
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                            Approve
                          </button>
                          <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                            Deny
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "analytics" && analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Summary Cards */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.totalRegistrations}</div>
                    <div className="text-sm text-gray-600">Total Registrations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{analytics.waitlistCount}</div>
                    <div className="text-sm text-gray-600">Waitlist</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{analytics.pendingApprovals}</div>
                    <div className="text-sm text-gray-600">Pending Approvals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.siblingPairings}</div>
                    <div className="text-sm text-gray-600">Sibling Pairings</div>
                  </div>
                </div>
              </div>

              {/* League Capacity */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">League Capacity</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.leagueCapacity).map(([league, capacity]) => (
                    <div key={league} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{league}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (capacity / 100) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{capacity}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {analytics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.user}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {activity.timestamp.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RecAdminHub; 