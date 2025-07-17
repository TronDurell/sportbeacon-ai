import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Download,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Star,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useI18n } from '../../lib/i18n';

// Mock types and interfaces
interface TownRecRequest {
  id: string;
  type: 'WAITLIST' | 'AGE_OVERRIDE' | 'SIBLING_PAIRING';
  childId: string;
  leagueId: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  adminNote?: string;
  timestamp: Date;
  parentName: string;
  childName: string;
  childAge: number;
  leagueName: string;
}

interface TownRecPolicy {
  minAge: number;
  maxAge: number;
  autoAcceptSiblings: boolean;
  waitlistAutoFill: boolean;
  overrideEmailTo?: string;
  refundPolicy: string;
  registrationDeadline: Date;
}

// Mock user and group check
const useCurrentUser = () => ({
  id: 'admin1',
  email: 'admin@cary.gov',
  groups: ['testGroups.caryAdminTest'],
  role: 'TownStaff' as const,
  permissions: ['read', 'write', 'approve', 'override']
});

// Mock data
const mockRequests: TownRecRequest[] = [
  {
    id: '1',
    type: 'AGE_OVERRIDE',
    childId: 'child1',
    leagueId: 'league1',
    status: 'PENDING',
    adminNote: 'Child is 4 months under age limit but shows advanced skills',
    timestamp: new Date('2024-01-15'),
    parentName: 'Sarah Johnson',
    childName: 'Alex Johnson',
    childAge: 5,
    leagueName: 'U8 Soccer'
  },
  {
    id: '2',
    type: 'SIBLING_PAIRING',
    childId: 'child2',
    leagueId: 'league2',
    status: 'APPROVED',
    adminNote: 'Siblings matched successfully',
    timestamp: new Date('2024-01-14'),
    parentName: 'Mike Davis',
    childName: 'Emma Davis',
    childAge: 7,
    leagueName: 'U10 Basketball'
  },
  {
    id: '3',
    type: 'WAITLIST',
    childId: 'child3',
    leagueId: 'league3',
    status: 'PENDING',
    adminNote: 'League full, waiting for spot',
    timestamp: new Date('2024-01-13'),
    parentName: 'Lisa Chen',
    childName: 'Ryan Chen',
    childAge: 9,
    leagueName: 'U12 Baseball'
  }
];

const RecAuditPanel: React.FC = () => {
  const { t } = useI18n();
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'waitlist' | 'siblings' | 'ageOverrides' | 'approvals' | 'sandbox'>('waitlist');
  const [requests, setRequests] = useState<TownRecRequest[]>(mockRequests);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DENIED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user has access to Town Rec features
  if (!user.groups.includes('testGroups.caryAdminTest')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">You need Town Rec admin permissions to access this panel.</p>
        </div>
      </div>
    );
  }

  // Filter requests based on status and search
  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'ALL' || request.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      request.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leagueName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle admin actions
  const handleAction = async (action: string, requestId: string, decision?: 'APPROVED' | 'DENIED', note?: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: decision || req.status, adminNote: note || req.adminNote }
          : req
      ));

      // Log to audit trail
      logAuditTrail(action, { requestId, decision, note, adminId: user.id });

      // Show success toast
      toast.success(t(`success.${action}`));
    } catch (error) {
      toast.error(t(`errors.${action}`));
    }
  };

  // Mock audit trail logging
  const logAuditTrail = (action: string, data: any) => {
    // Log audit trail for compliance and security monitoring
    const auditEntry = {
      action,
      data,
      timestamp: new Date(),
      userId: user?.id,
      sessionId: sessionStorage.getItem('sessionId')
    };
    
    // TODO: Send to audit log service
    // auditLogService.log(auditEntry);
  };

  const tabs = [
    { id: 'waitlist', label: t('admin.waitlistExceptions'), icon: Users },
    { id: 'siblings', label: t('admin.siblingPairing'), icon: Users },
    { id: 'ageOverrides', label: t('admin.ageOverrideRequests'), icon: AlertTriangle },
    { id: 'approvals', label: t('admin.approvalQueue'), icon: CheckCircle },
    { id: 'sandbox', label: t('admin.sandboxTestSubmit'), icon: Settings }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6" data-testid="audit-panel">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.townRecAuditPanel')}</h1>
            <p className="text-gray-600 mt-1">Town of Cary Parks & Recreation Administration</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">{user.role}</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Settings className="w-4 h-4" />
              {t('common.settings')}
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">{t('common.all')}</option>
            <option value="PENDING">{t('admin.pending')}</option>
            <option value="APPROVED">{t('admin.approved')}</option>
            <option value="DENIED">{t('admin.denied')}</option>
          </select>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'waitlist' && (
                <WaitlistExceptions 
                  requests={filteredRequests.filter(r => r.type === 'WAITLIST')}
                  onAction={handleAction}
                />
              )}
              {activeTab === 'siblings' && (
                <SiblingPairing 
                  requests={filteredRequests.filter(r => r.type === 'SIBLING_PAIRING')}
                  onAction={handleAction}
                />
              )}
              {activeTab === 'ageOverrides' && (
                <AgeOverrideRequests 
                  requests={filteredRequests.filter(r => r.type === 'AGE_OVERRIDE')}
                  onAction={handleAction}
                />
              )}
              {activeTab === 'approvals' && (
                <ApprovalQueue 
                  requests={filteredRequests.filter(r => r.status === 'PENDING')}
                  onAction={handleAction}
                />
              )}
              {activeTab === 'sandbox' && (
                <SandboxTestSubmit onAction={handleAction} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Sub-tab Components
const WaitlistExceptions: React.FC<{ requests: TownRecRequest[], onAction: Function }> = ({ requests, onAction }) => (
  <div data-testid="waitlistExceptions">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900">Waitlist Exceptions</h3>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{requests.length} requests</span>
        <button className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
    </div>
    <RequestList requests={requests} onAction={onAction} />
  </div>
);

const SiblingPairing: React.FC<{ requests: TownRecRequest[], onAction: Function }> = ({ requests, onAction }) => (
  <div data-testid="siblingPairing">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900">Sibling Pairing</h3>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{requests.length} requests</span>
        <button className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200">
          <Plus className="w-4 h-4" />
          Auto-Pair
        </button>
      </div>
    </div>
    <RequestList requests={requests} onAction={onAction} />
  </div>
);

const AgeOverrideRequests: React.FC<{ requests: TownRecRequest[], onAction: Function }> = ({ requests, onAction }) => (
  <div data-testid="ageOverrideRequests">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900">Age Override Requests</h3>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{requests.length} requests</span>
        <button className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200">
          <AlertTriangle className="w-4 h-4" />
          Review All
        </button>
      </div>
    </div>
    <RequestList requests={requests} onAction={onAction} />
  </div>
);

const ApprovalQueue: React.FC<{ requests: TownRecRequest[], onAction: Function }> = ({ requests, onAction }) => (
  <div data-testid="approvalQueue">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900">Approval Queue</h3>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{requests.length} pending</span>
        <button className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200">
          <CheckCircle className="w-4 h-4" />
          Bulk Approve
        </button>
      </div>
    </div>
    <RequestList requests={requests} onAction={onAction} />
  </div>
);

const SandboxTestSubmit: React.FC<{ onAction: Function }> = ({ onAction }) => (
  <div data-testid="sandboxTestSubmit">
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-yellow-900 mb-4">Sandbox Test Environment</h3>
      <p className="text-yellow-800 mb-4">
        This is a test environment for Town Rec automation. All actions are logged but not applied to production data.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onAction('testWaitlist', 'test-1')}
          className="p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50"
        >
          <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Test Waitlist</p>
        </button>
        <button
          onClick={() => onAction('testSibling', 'test-2')}
          className="p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50"
        >
          <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Test Sibling Pairing</p>
        </button>
        <button
          onClick={() => onAction('testAgeOverride', 'test-3')}
          className="p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50"
        >
          <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Test Age Override</p>
        </button>
      </div>
    </div>
  </div>
);

// Request List Component
const RequestList: React.FC<{ requests: TownRecRequest[], onAction: Function }> = ({ requests, onAction }) => (
  <div className="space-y-4">
    {requests.length === 0 ? (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No requests found</p>
      </div>
    ) : (
      requests.map((request) => (
        <RequestCard key={request.id} request={request} onAction={onAction} />
      ))
    )}
  </div>
);

// Request Card Component
const RequestCard: React.FC<{ request: TownRecRequest, onAction: Function }> = ({ request, onAction }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [note, setNote] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'DENIED': return 'text-red-600 bg-red-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WAITLIST': return <Users className="w-4 h-4" />;
      case 'SIBLING_PAIRING': return <Users className="w-4 h-4" />;
      case 'AGE_OVERRIDE': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {getTypeIcon(request.type)}
            <h4 className="font-medium text-gray-900">{request.parentName}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {request.status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Child:</span>
              <p className="font-medium">{request.childName} ({request.childAge})</p>
            </div>
            <div>
              <span className="text-gray-500">League:</span>
              <p className="font-medium">{request.leagueName}</p>
            </div>
            <div>
              <span className="text-gray-500">Type:</span>
              <p className="font-medium">{request.type.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>
              <p className="font-medium">{request.timestamp.toLocaleDateString()}</p>
            </div>
          </div>
          {request.adminNote && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{request.adminNote}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Eye className="w-4 h-4" />
          </button>
          {request.status === 'PENDING' && (
            <>
              <button
                onClick={() => onAction('approve', request.id, 'APPROVED', note)}
                className="p-2 text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAction('deny', request.id, 'DENIED', note)}
                className="p-2 text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Add a note about this decision..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecAuditPanel; 