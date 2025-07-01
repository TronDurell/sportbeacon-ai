import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { analytics } from '../../lib/ai/shared/analytics';

interface ExceptionRequest {
  id: string;
  leagueId: string;
  userId: string;
  birthSex: string;
  genderIdentity: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'denied';
  reason?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  leagueName: string;
  leagueTown: string;
  userPreferredName: string;
}

interface LeagueOverride {
  id: string;
  leagueId: string;
  userId: string;
  approvedBy: string;
  policyType: 'gender' | 'contact' | 'identity';
  originalAssignment: string;
  overrideAssignment: string;
  decisionDate: Date;
  reason: string;
}

interface AdminLeagueDashboardProps {
  adminId: string;
}

export const AdminLeagueDashboard: React.FC<AdminLeagueDashboardProps> = ({
  adminId
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'denied' | 'overrides'>('pending');
  const [requests, setRequests] = useState<ExceptionRequest[]>([]);
  const [overrides, setOverrides] = useState<LeagueOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExceptionRequest | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'overrides') {
        await loadOverrides();
      } else {
        await loadRequests();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    const requestsRef = collection(firestore, 'exception_requests');
    const requestsQuery = query(
      requestsRef,
      where('status', '==', activeTab),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const requestsSnap = await getDocs(requestsQuery);
    const requestsData = requestsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as ExceptionRequest[];
    
    setRequests(requestsData);
  };

  const loadOverrides = async () => {
    const overridesRef = collection(firestore, 'league_overrides');
    const overridesQuery = query(
      overridesRef,
      orderBy('decisionDate', 'desc'),
      limit(50)
    );
    
    const overridesSnap = await getDocs(overridesQuery);
    const overridesData = overridesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      decisionDate: doc.data().decisionDate.toDate()
    })) as LeagueOverride[];
    
    setOverrides(overridesData);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApproveRequest = async (request: ExceptionRequest) => {
    Alert.alert(
      'Approve Request',
      `Are you sure you want to approve ${request.userPreferredName}'s request to join ${request.leagueName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => approveRequest(request)
        }
      ]
    );
  };

  const handleDenyRequest = async (request: ExceptionRequest) => {
    Alert.alert(
      'Deny Request',
      `Are you sure you want to deny ${request.userPreferredName}'s request to join ${request.leagueName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deny',
          style: 'destructive',
          onPress: () => denyRequest(request)
        }
      ]
    );
  };

  const approveRequest = async (request: ExceptionRequest) => {
    try {
      // Update request status
      const requestRef = doc(firestore, 'exception_requests', request.id);
      await updateDoc(requestRef, {
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: Timestamp.now(),
        adminNotes: 'Request approved by admin'
      });

      // Create override record
      const overrideId = `${request.leagueId}_${request.userId}`;
      const overrideRef = doc(firestore, 'league_overrides', overrideId);
      
      const override: LeagueOverride = {
        id: overrideId,
        leagueId: request.leagueId,
        userId: request.userId,
        approvedBy: adminId,
        policyType: 'gender',
        originalAssignment: request.birthSex,
        overrideAssignment: request.genderIdentity,
        decisionDate: new Date(),
        reason: 'Exception request approved'
      };

      await updateDoc(overrideRef, {
        ...override,
        decisionDate: Timestamp.fromDate(override.decisionDate)
      });

      // Notify user
      await notifyUser(request.userId, 'request_approved', {
        leagueName: request.leagueName,
        adminId
      });

      // Track analytics
      await analytics.track('exception_request_approved', {
        requestId: request.id,
        leagueId: request.leagueId,
        userId: request.userId,
        adminId,
        timestamp: new Date().toISOString()
      });

      // Log admin action
      await logAdminAction('request_approved', request.id, {
        leagueId: request.leagueId,
        userId: request.userId,
        adminId
      });

      Alert.alert('Success', 'Request approved successfully');
      loadData();

    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert('Error', 'Failed to approve request. Please try again.');
    }
  };

  const denyRequest = async (request: ExceptionRequest) => {
    try {
      // Update request status
      const requestRef = doc(firestore, 'exception_requests', request.id);
      await updateDoc(requestRef, {
        status: 'denied',
        reviewedBy: adminId,
        reviewedAt: Timestamp.now(),
        adminNotes: 'Request denied by admin'
      });

      // Notify user
      await notifyUser(request.userId, 'request_denied', {
        leagueName: request.leagueName,
        adminId
      });

      // Track analytics
      await analytics.track('exception_request_denied', {
        requestId: request.id,
        leagueId: request.leagueId,
        userId: request.userId,
        adminId,
        timestamp: new Date().toISOString()
      });

      // Log admin action
      await logAdminAction('request_denied', request.id, {
        leagueId: request.leagueId,
        userId: request.userId,
        adminId
      });

      Alert.alert('Success', 'Request denied successfully');
      loadData();

    } catch (error) {
      console.error('Error denying request:', error);
      Alert.alert('Error', 'Failed to deny request. Please try again.');
    }
  };

  const renderRequestCard = (request: ExceptionRequest) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestTitle}>{request.userPreferredName}</Text>
        <Text style={styles.requestDate}>
          {request.timestamp.toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.requestDetails}>
        <Text style={styles.detailLabel}>League:</Text>
        <Text style={styles.detailValue}>{request.leagueName} ({request.leagueTown})</Text>
        
        <Text style={styles.detailLabel}>Gender Identity:</Text>
        <Text style={styles.detailValue}>{request.genderIdentity}</Text>
        
        <Text style={styles.detailLabel}>Assigned at Birth:</Text>
        <Text style={styles.detailValue}>{request.birthSex}</Text>
        
        {request.reason && (
          <>
            <Text style={styles.detailLabel}>Reason:</Text>
            <Text style={styles.detailValue}>{request.reason}</Text>
          </>
        )}
      </View>

      {activeTab === 'pending' && (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveRequest(request)}
          >
            <MaterialIcons name="check" size={20} color="white" />
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.denyButton]}
            onPress={() => handleDenyRequest(request)}
          >
            <MaterialIcons name="close" size={20} color="white" />
            <Text style={styles.denyButtonText}>Deny</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab !== 'pending' && request.reviewedBy && (
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewText}>
            Reviewed by: {request.reviewedBy} on {request.reviewedAt?.toLocaleDateString()}
          </Text>
          {request.adminNotes && (
            <Text style={styles.adminNotes}>Notes: {request.adminNotes}</Text>
          )}
        </View>
      )}
    </View>
  );

  const renderOverrideCard = (override: LeagueOverride) => (
    <View key={override.id} style={styles.overrideCard}>
      <View style={styles.overrideHeader}>
        <Text style={styles.overrideTitle}>Override: {override.userId}</Text>
        <Text style={styles.overrideDate}>
          {override.decisionDate.toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.overrideDetails}>
        <Text style={styles.detailLabel}>League ID:</Text>
        <Text style={styles.detailValue}>{override.leagueId}</Text>
        
        <Text style={styles.detailLabel}>Policy Type:</Text>
        <Text style={styles.detailValue}>{override.policyType}</Text>
        
        <Text style={styles.detailLabel}>Original Assignment:</Text>
        <Text style={styles.detailValue}>{override.originalAssignment}</Text>
        
        <Text style={styles.detailLabel}>Override Assignment:</Text>
        <Text style={styles.detailValue}>{override.overrideAssignment}</Text>
        
        <Text style={styles.detailLabel}>Approved By:</Text>
        <Text style={styles.detailValue}>{override.approvedBy}</Text>
        
        <Text style={styles.detailLabel}>Reason:</Text>
        <Text style={styles.detailValue}>{override.reason}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>League Administration</Text>
        <Text style={styles.headerSubtitle}>Exception Requests & Overrides</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
          { key: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'approved').length },
          { key: 'denied', label: 'Denied', count: requests.filter(r => r.status === 'denied').length },
          { key: 'overrides', label: 'Overrides', count: overrides.length }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : activeTab === 'overrides' ? (
          overrides.length > 0 ? (
            overrides.map(renderOverrideCard)
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No overrides found</Text>
            </View>
          )
        ) : (
          requests.length > 0 ? (
            requests.map(renderRequestCard)
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                No {activeTab} requests found
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
};

const notifyUser = async (userId: string, type: string, data: any) => {
  try {
    // This would integrate with your notification system
    console.log(`🔔 User notification to ${userId}: ${type}`, data);
    
    // Track analytics
    await analytics.track('user_notification_sent', {
      userId,
      type,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error notifying user:', error);
  }
};

const logAdminAction = async (action: string, requestId: string, data: any) => {
  try {
    await addDoc(collection(firestore, 'admin_actions'), {
      action,
      requestId,
      ...data,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: 5,
    right: 10,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  requestDate: {
    fontSize: 14,
    color: '#666',
  },
  requestDetails: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  approveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  denyButton: {
    backgroundColor: '#dc3545',
  },
  denyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  reviewInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  adminNotes: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  overrideCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overrideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  overrideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  overrideDate: {
    fontSize: 14,
    color: '#666',
  },
  overrideDetails: {
    // Same as requestDetails
  },
}); 