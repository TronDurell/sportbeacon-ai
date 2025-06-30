import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Switch } from 'react-native';
import { PlusIcon, TrashIcon, PlayIcon, PauseIcon, SaveIcon, SettingsIcon } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { firestore } from '../../lib/firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { analytics } from '../../lib/ai/shared/analytics';

export interface DrillStep {
  id: string;
  cueText: string;
  audioCue?: string;
  duration: number;
  positionRef?: {
    x: number;
    y: number;
    description: string;
  };
  order: number;
}

export interface CustomDrill {
  id?: string;
  name: string;
  description: string;
  category: 'defensive' | 'competition' | 'training' | 'custom';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: DrillStep[];
  totalDuration: number;
  estimatedShots: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function DrillBuilder() {
  const { user } = useAuth();
  const [drill, setDrill] = useState<CustomDrill>({
    name: '',
    description: '',
    category: 'training',
    difficulty: 'intermediate',
    steps: [],
    totalDuration: 0,
    estimatedShots: 0,
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'defensive', label: 'Defensive', color: '#ef4444' },
    { value: 'competition', label: 'Competition', color: '#3b82f6' },
    { value: 'training', label: 'Training', color: '#10b981' },
    { value: 'custom', label: 'Custom', color: '#8b5cf6' }
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner', color: '#10b981' },
    { value: 'intermediate', label: 'Intermediate', color: '#f59e0b' },
    { value: 'advanced', label: 'Advanced', color: '#ef4444' }
  ];

  useEffect(() => {
    // Request audio permissions
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Audio recording permission is required to create audio cues.');
      }
    })();
  }, []);

  const addStep = () => {
    const newStep: DrillStep = {
      id: Date.now().toString(),
      cueText: '',
      duration: 5,
      order: drill.steps.length
    };

    setDrill(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
      totalDuration: prev.totalDuration + newStep.duration,
      estimatedShots: prev.estimatedShots + 1
    }));
  };

  const removeStep = (stepId: string) => {
    const step = drill.steps.find(s => s.id === stepId);
    if (step) {
      setDrill(prev => ({
        ...prev,
        steps: prev.steps.filter(s => s.id !== stepId),
        totalDuration: prev.totalDuration - step.duration,
        estimatedShots: Math.max(0, prev.estimatedShots - 1)
      }));
    }
  };

  const updateStep = (stepId: string, updates: Partial<DrillStep>) => {
    setDrill(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId 
          ? { ...step, ...updates }
          : step
      )
    }));
  };

  const startRecording = async (stepId: string) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async (stepId: string) => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        updateStep(stepId, { audioCue: uri });
      }

      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const playAudio = async (audioUri: string) => {
    try {
      if (playingAudio === audioUri) {
        setPlayingAudio(null);
        return;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      setPlayingAudio(audioUri);
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAudio(null);
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const pickAudioFile = async (stepId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true
      });

      if (result.type === 'success') {
        updateStep(stepId, { audioCue: result.uri });
      }
    } catch (error) {
      console.error('Failed to pick audio file:', error);
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const saveDrill = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!drill.name.trim()) {
      Alert.alert('Error', 'Drill name is required');
      return;
    }

    if (drill.steps.length === 0) {
      Alert.alert('Error', 'At least one step is required');
      return;
    }

    // Validate steps
    for (const step of drill.steps) {
      if (!step.cueText.trim()) {
        Alert.alert('Error', 'All steps must have cue text');
        return;
      }
      if (step.duration < 1) {
        Alert.alert('Error', 'Step duration must be at least 1 second');
        return;
      }
    }

    try {
      setLoading(true);

      const drillData: Omit<CustomDrill, 'id'> = {
        ...drill,
        name: drill.name.trim(),
        description: drill.description.trim(),
        updatedAt: new Date()
      };

      let drillId: string;

      if (drill.id) {
        // Update existing drill
        const drillRef = doc(firestore, 'users', user.uid, 'custom_drills', drill.id);
        await setDoc(drillRef, drillData);
        drillId = drill.id;
      } else {
        // Create new drill
        const drillsRef = collection(firestore, 'users', user.uid, 'custom_drills');
        const docRef = await addDoc(drillsRef, drillData);
        drillId = docRef.id;
      }

      // Track analytics
      await analytics.track('custom_drill_saved', {
        userId: user.uid,
        drillId,
        drillName: drillData.name,
        stepCount: drillData.steps.length,
        totalDuration: drillData.totalDuration,
        isPublic: drillData.isPublic,
        timestamp: new Date().toISOString()
      });

      Alert.alert('Success', `Drill "${drillData.name}" saved successfully!`);
      
      // Reset form
      setDrill({
        name: '',
        description: '',
        category: 'training',
        difficulty: 'intermediate',
        steps: [],
        totalDuration: 0,
        estimatedShots: 0,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

    } catch (error) {
      console.error('Failed to save drill:', error);
      Alert.alert('Error', 'Failed to save drill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-2xl font-bold">Drill Builder</Text>
        <Pressable
          onPress={saveDrill}
          disabled={loading}
          className={`bg-emerald-600 rounded-xl p-2 ${loading ? 'opacity-50' : ''}`}
        >
          <SaveIcon color="white" size={20} />
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        {/* Drill Basic Info */}
        <View className="bg-zinc-900 rounded-2xl p-6 mb-6">
          <Text className="text-white text-lg font-semibold mb-4">Drill Information</Text>
          
          <View className="mb-4">
            <Text className="text-zinc-300 text-sm mb-2">Drill Name</Text>
            <TextInput
              value={drill.name}
              onChangeText={(text) => setDrill(prev => ({ ...prev, name: text }))}
              placeholder="Enter drill name"
              placeholderTextColor="#6b7280"
              className="bg-zinc-800 rounded-xl px-4 py-3 text-white border border-zinc-700"
            />
          </View>

          <View className="mb-4">
            <Text className="text-zinc-300 text-sm mb-2">Description</Text>
            <TextInput
              value={drill.description}
              onChangeText={(text) => setDrill(prev => ({ ...prev, description: text }))}
              placeholder="Describe the drill"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
              className="bg-zinc-800 rounded-xl px-4 py-3 text-white border border-zinc-700"
            />
          </View>

          <View className="flex-row space-x-4 mb-4">
            <View className="flex-1">
              <Text className="text-zinc-300 text-sm mb-2">Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                  <Pressable
                    key={category.value}
                    onPress={() => setDrill(prev => ({ ...prev, category: category.value as any }))}
                    className={`mr-2 px-3 py-2 rounded-lg border ${
                      drill.category === category.value 
                        ? 'border-white' 
                        : 'border-zinc-700'
                    }`}
                    style={{ backgroundColor: drill.category === category.value ? category.color + '20' : '#27272a' }}
                  >
                    <Text className={`text-sm ${
                      drill.category === category.value ? 'text-white' : 'text-zinc-400'
                    }`}>
                      {category.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <View className="flex-row space-x-4 mb-4">
            <View className="flex-1">
              <Text className="text-zinc-300 text-sm mb-2">Difficulty</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {difficulties.map((difficulty) => (
                  <Pressable
                    key={difficulty.value}
                    onPress={() => setDrill(prev => ({ ...prev, difficulty: difficulty.value as any }))}
                    className={`mr-2 px-3 py-2 rounded-lg border ${
                      drill.difficulty === difficulty.value 
                        ? 'border-white' 
                        : 'border-zinc-700'
                    }`}
                    style={{ backgroundColor: drill.difficulty === difficulty.value ? difficulty.color + '20' : '#27272a' }}
                  >
                    <Text className={`text-sm ${
                      drill.difficulty === difficulty.value ? 'text-white' : 'text-zinc-400'
                    }`}>
                      {difficulty.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-zinc-300 text-sm">Make Public</Text>
            <Switch
              value={drill.isPublic}
              onValueChange={(value) => setDrill(prev => ({ ...prev, isPublic: value }))}
              trackColor={{ false: '#3f3f46', true: '#10b981' }}
              thumbColor={drill.isPublic ? '#ffffff' : '#6b7280'}
            />
          </View>
        </View>

        {/* Drill Steps */}
        <View className="bg-zinc-900 rounded-2xl p-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-semibold">Drill Steps</Text>
            <Pressable
              onPress={addStep}
              className="bg-blue-600 rounded-xl p-2"
            >
              <PlusIcon color="white" size={20} />
            </Pressable>
          </View>

          {drill.steps.length === 0 ? (
            <View className="items-center py-8">
              <SettingsIcon color="#6b7280" size={48} />
              <Text className="text-zinc-400 text-lg mt-4">No steps yet</Text>
              <Text className="text-zinc-500 text-center mt-2">
                Add steps to create your drill
              </Text>
            </View>
          ) : (
            drill.steps.map((step, index) => (
              <View key={step.id} className="bg-zinc-800 rounded-xl p-4 mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-white font-semibold">Step {index + 1}</Text>
                  <Pressable
                    onPress={() => removeStep(step.id)}
                    className="bg-red-600 rounded-lg p-2"
                  >
                    <TrashIcon color="white" size={16} />
                  </Pressable>
                </View>

                <View className="mb-3">
                  <Text className="text-zinc-300 text-sm mb-2">Cue Text</Text>
                  <TextInput
                    value={step.cueText}
                    onChangeText={(text) => updateStep(step.id, { cueText: text })}
                    placeholder="Enter step instruction"
                    placeholderTextColor="#6b7280"
                    className="bg-zinc-700 rounded-lg px-3 py-2 text-white border border-zinc-600"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-zinc-300 text-sm mb-2">Duration (seconds)</Text>
                  <TextInput
                    value={step.duration.toString()}
                    onChangeText={(text) => {
                      const duration = parseInt(text) || 0;
                      if (duration > 0) {
                        const oldDuration = step.duration;
                        updateStep(step.id, { duration });
                        setDrill(prev => ({
                          ...prev,
                          totalDuration: prev.totalDuration - oldDuration + duration
                        }));
                      }
                    }}
                    placeholder="5"
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                    className="bg-zinc-700 rounded-lg px-3 py-2 text-white border border-zinc-600"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-zinc-300 text-sm mb-2">Audio Cue</Text>
                  <View className="flex-row space-x-2">
                    {step.audioCue ? (
                      <>
                        <Pressable
                          onPress={() => playAudio(step.audioCue!)}
                          className="flex-1 bg-green-600 rounded-lg py-2 items-center"
                        >
                          {playingAudio === step.audioCue ? (
                            <PauseIcon color="white" size={16} />
                          ) : (
                            <PlayIcon color="white" size={16} />
                          )}
                        </Pressable>
                        <Pressable
                          onPress={() => updateStep(step.id, { audioCue: undefined })}
                          className="bg-red-600 rounded-lg px-3 py-2"
                        >
                          <TrashIcon color="white" size={16} />
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <Pressable
                          onPress={() => startRecording(step.id)}
                          className="flex-1 bg-blue-600 rounded-lg py-2 items-center"
                        >
                          <Text className="text-white text-sm">
                            {isRecording ? 'Recording...' : 'Record'}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => pickAudioFile(step.id)}
                          className="flex-1 bg-purple-600 rounded-lg py-2 items-center"
                        >
                          <Text className="text-white text-sm">Pick File</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Drill Summary */}
          {drill.steps.length > 0 && (
            <View className="bg-zinc-800 rounded-xl p-4">
              <Text className="text-white font-semibold mb-2">Drill Summary</Text>
              <View className="flex-row justify-between">
                <Text className="text-zinc-400">Total Steps: {drill.steps.length}</Text>
                <Text className="text-zinc-400">Duration: {drill.totalDuration}s</Text>
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-zinc-400">Estimated Shots: {drill.estimatedShots}</Text>
                <Text className="text-zinc-400">Difficulty: {drill.difficulty}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
} 