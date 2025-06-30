import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { ShieldIcon, TargetIcon, BarChart3Icon, SettingsIcon } from 'lucide-react-native';
import DrillLab from './DrillLab';
import CoachOverlay from './CoachOverlay';
import RangeReport from './RangeReport';
import ShooterVerification from './ShooterVerification';
import { useAuth } from '../../frontend/hooks/useAuth';
import { getUserRangeStats } from './firebase-schema';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function RangeOfficerTabs() {
  const { user } = useAuth();
  const [isVerified, setIsVerified] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    checkVerificationStatus();
  }, [user]);

  const checkVerificationStatus = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      const stats = await getUserRangeStats(user.uid);
      setIsVerified(stats?.isShooterVerified || false);
    } catch (error) {
      console.error('Failed to check verification status:', error);
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg">Loading...</Text>
      </View>
    );
  }

  if (!isVerified) {
    return <ShooterVerification />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#18181b',
          borderTopColor: '#3f3f46',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#6b7280',
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#ffffff',
      }}
    >
      <Tab.Screen
        name="DrillLab"
        component={DrillLab}
        options={{
          title: 'Drill Lab',
          tabBarIcon: ({ color, size }) => (
            <TargetIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="RangeReport"
        component={RangeReport}
        options={{
          title: 'Range Report',
          tabBarIcon: ({ color, size }) => (
            <BarChart3Icon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ShooterVerification"
        component={ShooterVerification}
        options={{
          title: 'Verification',
          tabBarIcon: ({ color, size }) => (
            <ShieldIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RangeOfficerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#ffffff',
      }}
    >
      <Stack.Screen
        name="RangeOfficerTabs"
        component={RangeOfficerTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DrillSession"
        component={DrillSessionScreen}
        options={{
          title: 'Drill Session',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}

// Drill Session Screen Component
function DrillSessionScreen({ route, navigation }) {
  const { drillId, sessionId } = route.params;
  const [currentScore, setCurrentScore] = React.useState(0);
  const [showOverlay, setShowOverlay] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');

  const handleShotDetected = (score: number, shotFeedback: string) => {
    setCurrentScore(score);
    setFeedback(shotFeedback);
    setShowOverlay(true);

    // Hide overlay after 3 seconds
    setTimeout(() => {
      setShowOverlay(false);
    }, 3000);
  };

  return (
    <View className="flex-1 bg-black">
      {/* Camera view would go here */}
      <View className="flex-1 bg-zinc-900 justify-center items-center">
        <Text className="text-white text-2xl mb-4">Drill Session</Text>
        <Text className="text-zinc-400">Drill ID: {drillId}</Text>
        <Text className="text-zinc-400">Session ID: {sessionId}</Text>
      </View>

      {/* Coach Overlay */}
      {showOverlay && (
        <CoachOverlay
          score={currentScore}
          feedback={feedback}
          isVisible={showOverlay}
          onDismiss={() => setShowOverlay(false)}
        />
      )}
    </View>
  );
}

// Add to main navigation
export const addRangeOfficerToNavigation = (navigation) => {
  navigation.addListener('state', (e) => {
    // Check if user is verified before allowing access
    const currentRoute = e.data.state.routes[e.data.state.index];
    if (currentRoute.name === 'RangeOfficer') {
      // Additional verification logic here
    }
  });
}; 