import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Users, 
  Calendar, 
  MapPin, 
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Home,
  Building,
  Car,
  GraduationCap,
  Trophy,
  Award,
  Target,
  Zap,
  XCircle
} from "lucide-react";

interface SandboxUser {
  id: string;
  name: string;
  email: string;
  role: "TownStaff" | "RecDirector" | "RecCoordinator" | "TestParent" | "TestChild";
  department?: string;
  isActive: boolean;
  lastLogin?: Date;
  permissions: string[];
  testData: {
    registrations: number;
    waitlistEntries: number;
    overrides: number;
    approvals: number;
  };
}

interface SandboxLeague {
  id: string;
  name: string;
  ageGroup: string;
  sport: string;
  maxCapacity: number;
  currentRegistrations: number;
  waitlistCount: number;
  startDate: Date;
  endDate: Date;
  location: string;
  coach?: string;
  status: "active" | "full" | "waitlist" | "completed";
  testData: {
    participants: number;
    siblings: number;
    ageOverrides: number;
  };
}

interface SandboxScenario {
  id: string;
  name: string;
  description: string;
  category: "waitlist" | "overrides" | "siblings" | "registration" | "approvals";
  complexity: "basic" | "intermediate" | "advanced";
  steps: string[];
  expectedOutcome: string;
  isActive: boolean;
  completionRate: number;
  averageTime: number; // minutes
}

interface SandboxMetrics {
  totalUsers: number;
  activeUsers: number;
  totalRegistrations: number;
  waitlistEntries: number;
  pendingOverrides: number;
  pendingApprovals: number;
  scenarioCompletions: number;
  averageSessionTime: number;
  errorRate: number;
  userSatisfaction: number;
}

const TownCarySandbox: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<SandboxScenario | null>(null);
  const [sandboxUsers, setSandboxUsers] = useState<SandboxUser[]>([]);
  const [sandboxLeagues, setSandboxLeagues] = useState<SandboxLeague[]>([]);
  const [scenarios, setScenarios] = useState<SandboxScenario[]>([]);
  const [metrics, setMetrics] = useState<SandboxMetrics | null>(null);
  const [selectedUser, setSelectedUser] = useState<SandboxUser | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<SandboxLeague | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data for development
  useEffect(() => {
    const loadSandboxData = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock sandbox users
      const mockUsers: SandboxUser[] = [
        {
          id: "user_001",
          name: "Sarah Johnson",
          email: "sarah.johnson@cary.gov",
          role: "RecDirector",
          department: "ParksAndRec",
          isActive: true,
          lastLogin: new Date("2024-01-26T10:30:00"),
          permissions: ["waitlist_manage", "overrides_approve", "analytics_view", "users_manage"],
          testData: { registrations: 45, waitlistEntries: 12, overrides: 8, approvals: 15 }
        },
        {
          id: "user_002",
          name: "Michael Chen",
          email: "michael.chen@cary.gov",
          role: "RecCoordinator",
          department: "ParksAndRec",
          isActive: true,
          lastLogin: new Date("2024-01-26T09:15:00"),
          permissions: ["waitlist_manage", "registration_view", "analytics_view"],
          testData: { registrations: 32, waitlistEntries: 8, overrides: 3, approvals: 0 }
        },
        {
          id: "user_003",
          name: "Jennifer Smith",
          email: "jennifer.smith@test.com",
          role: "TestParent",
          isActive: true,
          lastLogin: new Date("2024-01-26T08:45:00"),
          permissions: ["registration_view"],
          testData: { registrations: 2, waitlistEntries: 1, overrides: 1, approvals: 0 }
        },
        {
          id: "user_004",
          name: "David Wilson",
          email: "david.wilson@test.com",
          role: "TestParent",
          isActive: true,
          lastLogin: new Date("2024-01-25T16:20:00"),
          permissions: ["registration_view"],
          testData: { registrations: 3, waitlistEntries: 0, overrides: 0, approvals: 0 }
        }
      ];

      // Mock sandbox leagues
      const mockLeagues: SandboxLeague[] = [
        {
          id: "league_001",
          name: "Youth Soccer U8",
          ageGroup: "U8",
          sport: "Soccer",
          maxCapacity: 24,
          currentRegistrations: 22,
          waitlistCount: 8,
          startDate: new Date("2024-03-01"),
          endDate: new Date("2024-05-31"),
          location: "Cary Community Center",
          coach: "Coach Martinez",
          status: "active",
          testData: { participants: 22, siblings: 6, ageOverrides: 2 }
        },
        {
          id: "league_002",
          name: "Youth Soccer U10",
          ageGroup: "U10",
          sport: "Soccer",
          maxCapacity: 32,
          currentRegistrations: 32,
          waitlistCount: 15,
          startDate: new Date("2024-03-01"),
          endDate: new Date("2024-05-31"),
          location: "Cary Community Center",
          coach: "Coach Rodriguez",
          status: "full",
          testData: { participants: 32, siblings: 8, ageOverrides: 5 }
        },
        {
          id: "league_003",
          name: "Youth Basketball U10",
          ageGroup: "U10",
          sport: "Basketball",
          maxCapacity: 20,
          currentRegistrations: 18,
          waitlistCount: 3,
          startDate: new Date("2024-02-15"),
          endDate: new Date("2024-04-30"),
          location: "Cary Gymnasium",
          coach: "Coach Thompson",
          status: "active",
          testData: { participants: 18, siblings: 4, ageOverrides: 1 }
        },
        {
          id: "league_004",
          name: "Youth Basketball U12",
          ageGroup: "U12",
          sport: "Basketball",
          maxCapacity: 24,
          currentRegistrations: 20,
          waitlistCount: 6,
          startDate: new Date("2024-02-15"),
          endDate: new Date("2024-04-30"),
          location: "Cary Gymnasium",
          coach: "Coach Williams",
          status: "active",
          testData: { participants: 20, siblings: 5, ageOverrides: 3 }
        }
      ];

      // Mock scenarios
      const mockScenarios: SandboxScenario[] = [
        {
          id: "scenario_001",
          name: "Waitlist Promotion",
          description: "Promote a child from waitlist to active registration when a spot opens",
          category: "waitlist",
          complexity: "basic",
          steps: [
            "Navigate to Waitlists tab",
            "Find a child in waitlist position #1",
            "Click \"Promote\" button",
            "Confirm promotion",
            "Verify child appears in registrations"
          ],
          expectedOutcome: "Child successfully promoted from waitlist to active registration",
          isActive: true,
          completionRate: 95,
          averageTime: 2
        },
        {
          id: "scenario_002",
          name: "Age Override Approval",
          description: "Review and approve an age override request for a child",
          category: "overrides",
          complexity: "intermediate",
          steps: [
            "Navigate to Age Overrides tab",
            "Find a pending override request",
            "Review child details and reason",
            "Click \"Approve\" or \"Deny\"",
            "Add director notes if needed",
            "Submit decision"
          ],
          expectedOutcome: "Override request processed and parent notified",
          isActive: true,
          completionRate: 88,
          averageTime: 4
        },
        {
          id: "scenario_003",
          name: "Sibling Pairing Conflict",
          description: "Resolve a sibling pairing conflict manually",
          category: "siblings",
          complexity: "advanced",
          steps: [
            "Navigate to Sibling Pairing tab",
            "Find a pairing with conflicts",
            "Review conflict details",
            "Choose resolution action",
            "Assign team if needed",
            "Confirm resolution"
          ],
          expectedOutcome: "Sibling pairing conflict resolved and children assigned",
          isActive: true,
          completionRate: 75,
          averageTime: 6
        },
        {
          id: "scenario_004",
          name: "Registration Analytics",
          description: "Generate and export registration analytics report",
          category: "registration",
          complexity: "basic",
          steps: [
            "Navigate to Analytics tab",
            "Review registration overview",
            "Check league capacity charts",
            "Export data to CSV",
            "Review exported file"
          ],
          expectedOutcome: "Analytics report generated and exported successfully",
          isActive: true,
          completionRate: 92,
          averageTime: 3
        }
      ];

      // Mock metrics
      const mockMetrics: SandboxMetrics = {
        totalUsers: mockUsers.length,
        activeUsers: mockUsers.filter(u => u.isActive).length,
        totalRegistrations: mockLeagues.reduce((sum, l) => sum + l.currentRegistrations, 0),
        waitlistEntries: mockLeagues.reduce((sum, l) => sum + l.waitlistCount, 0),
        pendingOverrides: 5,
        pendingApprovals: 3,
        scenarioCompletions: 156,
        averageSessionTime: 12.5,
        errorRate: 2.3,
        userSatisfaction: 4.7
      };

      setSandboxUsers(mockUsers);
      setSandboxLeagues(mockLeagues);
      setScenarios(mockScenarios);
      setMetrics(mockMetrics);
      setLoading(false);
    };

    loadSandboxData();
  }, []);

  const startSandbox = () => {
    setIsRunning(true);
    setCurrentScenario(null);
    // Initialize Town Cary Sandbox environment
  };

  const stopSandbox = () => {
    setIsRunning(false);
    setCurrentScenario(null);
    // Stop Town Cary Sandbox environment
  };

  const resetSandbox = () => {
    setIsRunning(false);
    setCurrentScenario(null);
    // Reset Town Cary Sandbox environment
  };

  const startScenario = (scenario: SandboxScenario) => {
    setCurrentScenario(scenario);
    // Execute scenario: ${scenario.name}
  };

  const completeScenario = () => {
    if (currentScenario) {
      // Scenario completed: ${currentScenario.name}
    }
    setCurrentScenario(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Town Cary Sandbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Town Cary Sandbox</h1>
            <p className="text-gray-600 mt-1">Isolated test environment for Cary Parks & Rec pilot</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isRunning ? "bg-green-500" : "bg-gray-400"}`}></div>
              <span className="text-sm text-gray-600">
                {isRunning ? "Running" : "Stopped"}
              </span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={resetSandbox}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            {isRunning ? (
              <button
                onClick={stopSandbox}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Pause className="w-4 h-4" />
                Stop
              </button>
            ) : (
              <button
                onClick={startSandbox}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Current Scenario */}
      {currentScenario && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Active Scenario: {currentScenario.name}</h3>
              <p className="text-blue-700 mt-1">{currentScenario.description}</p>
            </div>
            <button
              onClick={completeScenario}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Complete Scenario
            </button>
          </div>
        </motion.div>
      )}

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalRegistrations}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Waitlist</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.waitlistEntries}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.userSatisfaction}/5</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scenarios */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Test Scenarios</h2>
            <p className="text-sm text-gray-600 mt-1">Practice common administrative tasks</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{scenario.name}</h3>
                      <p className="text-sm text-gray-600">{scenario.description}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      scenario.complexity === "basic" ? "bg-green-100 text-green-800" :
                      scenario.complexity === "intermediate" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {scenario.complexity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>Completion: {scenario.completionRate}%</span>
                    <span>Avg Time: {scenario.averageTime} min</span>
                  </div>
                  <button
                    onClick={() => startScenario(scenario)}
                    disabled={!isRunning}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Scenario
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Test Users */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Test Users</h2>
            <p className="text-sm text-gray-600 mt-1">Sandbox user accounts and their test data</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {sandboxUsers.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "RecDirector" ? "bg-purple-100 text-purple-800" :
                      user.role === "RecCoordinator" ? "bg-blue-100 text-blue-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div>Registrations: {user.testData.registrations}</div>
                    <div>Waitlist: {user.testData.waitlistEntries}</div>
                    <div>Overrides: {user.testData.overrides}</div>
                    <div>Approvals: {user.testData.approvals}</div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leagues */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Test Leagues</h2>
          <p className="text-sm text-gray-600 mt-1">Sandbox sports leagues with test data</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  League
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waitlist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sandboxLeagues.map((league) => (
                <tr key={league.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{league.name}</div>
                      <div className="text-sm text-gray-500">{league.location}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      league.status === "active" ? "bg-green-100 text-green-800" :
                      league.status === "full" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {league.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {league.currentRegistrations}/{league.maxCapacity}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(league.currentRegistrations / league.maxCapacity) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{league.waitlistCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Participants: {league.testData.participants}</div>
                      <div>Siblings: {league.testData.siblings}</div>
                      <div>Overrides: {league.testData.ageOverrides}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedLeague(league)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedUser.role === "RecDirector" ? "bg-purple-100 text-purple-800" :
                      selectedUser.role === "RecCoordinator" ? "bg-blue-100 text-blue-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedUser.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                
                {selectedUser.department && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.department}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Permissions</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedUser.permissions.map((permission, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Test Data Summary</label>
                  <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                    <div>Registrations: {selectedUser.testData.registrations}</div>
                    <div>Waitlist Entries: {selectedUser.testData.waitlistEntries}</div>
                    <div>Age Overrides: {selectedUser.testData.overrides}</div>
                    <div>Approvals: {selectedUser.testData.approvals}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* League Details Modal */}
      {selectedLeague && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">League Details</h3>
                <button
                  onClick={() => setSelectedLeague(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">League Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLeague.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sport</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLeague.sport}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age Group</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLeague.ageGroup}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedLeague.status === "active" ? "bg-green-100 text-green-800" :
                      selectedLeague.status === "full" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {selectedLeague.status}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLeague.location}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedLeague.currentRegistrations}/{selectedLeague.maxCapacity}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Waitlist</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLeague.waitlistCount}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLeague.startDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLeague.endDate.toLocaleDateString()}</p>
                  </div>
                </div>
                
                {selectedLeague.coach && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Coach</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLeague.coach}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Test Data</label>
                  <div className="mt-1 grid grid-cols-3 gap-4 text-sm">
                    <div>Participants: {selectedLeague.testData.participants}</div>
                    <div>Siblings: {selectedLeague.testData.siblings}</div>
                    <div>Overrides: {selectedLeague.testData.ageOverrides}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TownCarySandbox; 