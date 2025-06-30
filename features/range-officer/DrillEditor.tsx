import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Switch } from 'react-native';
import { SaveIcon, PlusIcon, TrashIcon, SettingsIcon } from 'lucide-react-native';
import { firestore } from '../../lib/firebase';
import { doc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../frontend/hooks/useAuth';
import { analytics } from '../../lib/ai/shared/analytics';

interface CustomDrill {
  id?: string;
  name: string;
  repCount: number;
  scoringFocus: 'accuracy' | 'speed' | 'balance';
  timeLimit?: number;
  targetDistance?: number;
  customFeedback: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scoringFocusOptions = [
  { value: 'accuracy', label: 'Accuracy Focus', description: 'Prioritize precision over speed' },
  { value: 'speed', label: 'Speed Focus', description: 'Emphasize quick target acquisition' },
  { value: 'balance', label: 'Balanced', description: 'Equal focus on accuracy and speed' }
];

export default function DrillEditor() {
  const { user } = useAuth();
  const [customDrills, setCustomDrills] = useState<CustomDrill[]>([]);
  const [editingDrill, setEditingDrill] = useState<CustomDrill | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [drillName, setDrillName] = useState('');
  const [repCount, setRepCount] = useState(10);
  const [scoringFocus, setScoringFocus] = useState<'accuracy' | 'speed' | 'balance'>('balance');
  const [timeLimit, setTimeLimit] = useState(5000);
  const [targetDistance, setTargetDistance] = useState(7);
  const [customFeedback, setCustomFeedback] = useState<string[]>(['Good form', 'Keep it up']);
  const [newFeedback, setNewFeedback] = useState('');

  useEffect(() => {
    loadCustomDrills();
  }, [user]);

  const loadCustomDrills = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const drillsRef = collection(firestore, 'users', user.uid, 'custom_drills');
      const querySnapshot = await getDocs(drillsRef);
      
      const drills: CustomDrill[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        drills.push({
          id: doc.id,
          name: data.name,
          repCount: data.repCount,
          scoringFocus: data.scoringFocus,
          timeLimit: data.timeLimit,
          targetDistance: data.targetDistance,
          customFeedback: data.customFeedback || [],
          isActive: data.isActive !== false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      setCustomDrills(drills);
    } catch (error) {
      console.error('Failed to load custom drills:', error);
      Alert.alert('Error', 'Failed to load custom drills');
    } finally {
      setLoading(false);
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setEditingDrill(null);
    resetForm();
  };

  const editDrill = (drill: CustomDrill) => {
    setEditingDrill(drill);
    setIsCreating(false);
    setDrillName(drill.name);
    setRepCount(drill.repCount);
    setScoringFocus(drill.scoringFocus);
    setTimeLimit(drill.timeLimit || 5000);
    setTargetDistance(drill.targetDistance || 7);
    setCustomFeedback([...drill.customFeedback]);
  };

  const resetForm = () => {
    setDrillName('');
    setRepCount(10);
    setScoringFocus('balance');
    setTimeLimit(5000);
    setTargetDistance(7);
    setCustomFeedback(['Good form', 'Keep it up']);
    setNewFeedback('');
  };

  const addFeedback = () => {
    if (newFeedback.trim()) {
      setCustomFeedback([...customFeedback, newFeedback.trim()]);
      setNewFeedback('');
    }
  };

  const removeFeedback = (index: number) => {
    setCustomFeedback(customFeedback.filter((_, i) => i !== index));
  };

  const saveDrill = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!drillName.trim()) {
      Alert.alert('Error', 'Drill name is required');
      return;
    }

    if (repCount < 1 || repCount > 50) {
      Alert.alert('Error', 'Rep count must be between 1 and 50');
      return;
    }

    try {
      const drillData: Omit<CustomDrill, 'id'> = {
        name: drillName.trim(),
        repCount,
        scoringFocus,
        timeLimit,
        targetDistance,
        customFeedback,
        isActive: true,
        createdAt: editingDrill?.createdAt || new Date(),
        updatedAt: new Date()
      };

      if (editingDrill?.id) {
        // Update existing drill
        const drillRef = doc(firestore, 'users', user.uid, 'custom_drills', editingDrill.id);
        await setDoc(drillRef, drillData);
      } else {
        // Create new drill
        const drillsRef = collection(firestore, 'users', user.uid, 'custom_drills');
        await addDoc(drillsRef, drillData);
      }

      await analytics.track('custom_drill_saved', {
        userId: user.uid,
        drillName: drillData.name,
        scoringFocus: drillData.scoringFocus,
        isUpdate: !!editingDrill?.id,
        timestamp: new Date().toISOString()
      });

      Alert.alert('Success', `Drill "${drillData.name}" saved successfully!`);
      resetForm();
      setIsCreating(false);
      setEditingDrill(null);
      loadCustomDrills();
    } catch (error) {
      console.error('Failed to save drill:', error);
      Alert.alert('Error', 'Failed to save drill');
    }
  };

  const deleteDrill = async (drillId: string, drillName: string) => {
    Alert.alert(
      'Delete Drill',
      `Are you sure you want to delete "${drillName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const drillRef = doc(firestore, 'users', user!.uid, 'custom_drills', drillId);
              await deleteDoc(drillRef);

              await analytics.track('custom_drill_deleted', {
                userId: user!.uid,
                drillName,
                timestamp: new Date().toISOString()
              });

              Alert.alert('Success', 'Drill deleted successfully');
              loadCustomDrills();
            } catch (error) {
              console.error('Failed to delete drill:', error);
              Alert.alert('Error', 'Failed to delete drill');
            }
          }
        }
      ]
    );
  };

  const toggleDrillActive = async (drill: CustomDrill) => {
    try {
      const drillRef = doc(firestore, 'users', user!.uid, 'custom_drills', drill.id!);
      await updateDoc(drillRef, {
        isActive: !drill.isActive,
        updatedAt: new Date()
      });

      await analytics.track('custom_drill_toggled', {
        userId: user!.uid,
        drillName: drill.name,
        isActive: !drill.isActive,
        timestamp: new Date().toISOString()
      });

      loadCustomDrills();
    } catch (error) {
      console.error('Failed to toggle drill:', error);
      Alert.alert('Error', 'Failed to update drill status');
    }
  };

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-2xl font-bold">Drill Editor</Text>
        <Pressable
          onPress={startCreating}
          className="bg-emerald-600 rounded-xl p-2"
        >
          <PlusIcon color="white" size={20} />
        </Pressable>
      </View>

      {isCreating || editingDrill ? (
        <ScrollView className="flex-1">
          <View className="bg-zinc-900 rounded-2xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">
              {editingDrill ? 'Edit Drill' : 'Create New Drill'}
            </Text>

            {/* Drill Name */}
            <View className="mb-4">
              <Text className="text-zinc-300 text-sm mb-2">Drill Name</Text>
              <TextInput
                value={drillName}
                onChangeText={setDrillName}
                placeholder="Enter drill name"
                placeholderTextColor="#6b7280"
                className="bg-zinc-800 rounded-xl px-4 py-3 text-white border border-zinc-700"
              />
            </View>

            {/* Rep Count */}
            <View className="mb-4">
              <Text className="text-zinc-300 text-sm mb-2">Repetitions</Text>
              <TextInput
                value={repCount.toString()}
                onChangeText={(text) => setRepCount(parseInt(text) || 0)}
                placeholder="10"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                className="bg-zinc-800 rounded-xl px-4 py-3 text-white border border-zinc-700"
              />
            </View>

            {/* Scoring Focus */}
            <View className="mb-4">
              <Text className="text-zinc-300 text-sm mb-2">Scoring Focus</Text>
              {scoringFocusOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setScoringFocus(option.value as any)}
                  className={`p-3 rounded-xl mb-2 border ${
                    scoringFocus === option.value
                      ? 'bg-blue-600 border-blue-500'
                      : 'bg-zinc-800 border-zinc-700'
                  }`}
                >
                  <Text className="text-white font-medium">{option.label}</Text>
                  <Text className="text-zinc-400 text-sm">{option.description}</Text>
                </Pressable>
              ))}
            </View>

            {/* Time Limit */}
            <View className="mb-4">
              <Text className="text-zinc-300 text-sm mb-2">Time Limit (seconds)</Text>
              <TextInput
                value={(timeLimit / 1000).toString()}
                onChangeText={(text) => setTimeLimit((parseInt(text) || 5) * 1000)}
                placeholder="5"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                className="bg-zinc-800 rounded-xl px-4 py-3 text-white border border-zinc-700"
              />
            </View>

            {/* Target Distance */}
            <View className="mb-4">
              <Text className="text-zinc-300 text-sm mb-2">Target Distance (yards)</Text>
              <TextInput
                value={targetDistance.toString()}
                onChangeText={(text) => setTargetDistance(parseInt(text) || 7)}
                placeholder="7"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                className="bg-zinc-800 rounded-xl px-4 py-3 text-white border border-zinc-700"
              />
            </View>

            {/* Custom Feedback */}
            <View className="mb-6">
              <Text className="text-zinc-300 text-sm mb-2">Custom Feedback Messages</Text>
              {customFeedback.map((feedback, index) => (
                <View key={index} className="flex-row items-center mb-2">
                  <Text className="text-white flex-1 bg-zinc-800 rounded-lg px-3 py-2">
                    {feedback}
                  </Text>
                  <Pressable
                    onPress={() => removeFeedback(index)}
                    className="ml-2 bg-red-600 rounded-lg p-2"
                  >
                    <TrashIcon color="white" size={16} />
                  </Pressable>
                </View>
              ))}
              <View className="flex-row">
                <TextInput
                  value={newFeedback}
                  onChangeText={setNewFeedback}
                  placeholder="Add feedback message"
                  placeholderTextColor="#6b7280"
                  className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 text-white border border-zinc-700 mr-2"
                />
                <Pressable
                  onPress={addFeedback}
                  className="bg-blue-600 rounded-xl px-4 py-3"
                >
                  <PlusIcon color="white" size={20} />
                </Pressable>
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={saveDrill}
              className="bg-emerald-600 rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold text-lg">
                {editingDrill ? 'Update Drill' : 'Save Drill'}
              </Text>
            </Pressable>

            {/* Cancel Button */}
            <Pressable
              onPress={() => {
                setIsCreating(false);
                setEditingDrill(null);
                resetForm();
              }}
              className="mt-3 bg-zinc-700 rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold">Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView className="flex-1">
          {customDrills.length === 0 ? (
            <View className="flex-1 justify-center items-center py-12">
              <SettingsIcon color="#6b7280" size={48} />
              <Text className="text-zinc-400 text-lg mt-4">No custom drills yet</Text>
              <Text className="text-zinc-500 text-center mt-2">
                Create your first custom drill to get started
              </Text>
            </View>
          ) : (
            customDrills.map((drill) => (
              <View key={drill.id} className="bg-zinc-900 rounded-2xl p-4 mb-4">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-white text-lg font-semibold">{drill.name}</Text>
                    <Text className="text-zinc-400 text-sm">
                      {drill.repCount} reps • {scoringFocusOptions.find(o => o.value === drill.scoringFocus)?.label}
                    </Text>
                    <Text className="text-zinc-500 text-xs">
                      {drill.timeLimit ? `${drill.timeLimit / 1000}s limit` : 'No time limit'} • {drill.targetDistance}yd
                    </Text>
                  </View>
                  <View className="flex-row space-x-2">
                    <Switch
                      value={drill.isActive}
                      onValueChange={() => toggleDrillActive(drill)}
                      trackColor={{ false: '#3f3f46', true: '#10b981' }}
                      thumbColor={drill.isActive ? '#ffffff' : '#6b7280'}
                    />
                    <Pressable
                      onPress={() => editDrill(drill)}
                      className="bg-blue-600 rounded-lg p-2"
                    >
                      <SettingsIcon color="white" size={16} />
                    </Pressable>
                    <Pressable
                      onPress={() => deleteDrill(drill.id!, drill.name)}
                      className="bg-red-600 rounded-lg p-2"
                    >
                      <TrashIcon color="white" size={16} />
                    </Pressable>
                  </View>
                </View>
                
                {drill.customFeedback.length > 0 && (
                  <View className="bg-zinc-800 rounded-xl p-3">
                    <Text className="text-zinc-300 text-sm mb-2">Custom Feedback:</Text>
                    {drill.customFeedback.slice(0, 2).map((feedback, index) => (
                      <Text key={index} className="text-zinc-400 text-xs">
                        • {feedback}
                      </Text>
                    ))}
                    {drill.customFeedback.length > 2 && (
                      <Text className="text-zinc-500 text-xs">
                        +{drill.customFeedback.length - 2} more...
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
} 