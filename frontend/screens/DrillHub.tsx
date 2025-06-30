import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert, RefreshControl, TextInput } from 'react-native';
import { SearchIcon, FilterIcon, HeartIcon, CopyIcon, PlayIcon, StarIcon, UsersIcon, ClockIcon } from 'lucide-react-native';
import { firestore } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { analytics } from '../../lib/ai/shared/analytics';

export interface PublicDrill {
  id: string;
  title: string;
  description: string;
  creator: {
    uid: string;
    displayName: string;
    avatar?: string;
  };
  category: 'defensive' | 'competition' | 'training' | 'custom';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  steps: DrillStep[];
  totalDuration: number;
  estimatedShots: number;
  votes: number;
  downloads: number;
  rating: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  featured: boolean;
}

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

export interface DrillFilter {
  category?: string;
  difficulty?: string;
  minRating?: number;
  maxDuration?: number;
  tags?: string[];
}

export default function DrillHub() {
  const { user } = useAuth();
  const [drills, setDrills] = useState<PublicDrill[]>([]);
  const [filteredDrills, setFilteredDrills] = useState<PublicDrill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<DrillFilter>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');

  const categories = [
    { value: 'all', label: 'All', color: '#6b7280' },
    { value: 'defensive', label: 'Defensive', color: '#ef4444' },
    { value: 'competition', label: 'Competition', color: '#3b82f6' },
    { value: 'training', label: 'Training', color: '#10b981' },
    { value: 'custom', label: 'Custom', color: '#8b5cf6' }
  ];

  const difficulties = [
    { value: 'all', label: 'All', color: '#6b7280' },
    { value: 'beginner', label: 'Beginner', color: '#10b981' },
    { value: 'intermediate', label: 'Intermediate', color: '#f59e0b' },
    { value: 'advanced', label: 'Advanced', color: '#ef4444' }
  ];

  const sortOptions = [
    { value: 'popular', label: 'Popular', icon: '🔥' },
    { value: 'recent', label: 'Recent', icon: '🕒' },
    { value: 'rating', label: 'Top Rated', icon: '⭐' }
  ];

  useEffect(() => {
    loadPublicDrills();
  }, [sortBy]);

  useEffect(() => {
    filterDrills();
  }, [drills, searchQuery, activeFilter, selectedCategory, selectedDifficulty]);

  const loadPublicDrills = async () => {
    try {
      setLoading(true);
      
      const drillsRef = collection(firestore, 'public_drills');
      let q = query(
        drillsRef,
        where('isPublic', '==', true)
      );

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          q = query(q, orderBy('votes', 'desc'), orderBy('downloads', 'desc'));
          break;
        case 'recent':
          q = query(q, orderBy('createdAt', 'desc'));
          break;
        case 'rating':
          q = query(q, orderBy('rating', 'desc'), orderBy('ratingCount', 'desc'));
          break;
      }

      q = query(q, limit(50));
      const querySnapshot = await getDocs(q);

      const drillData: PublicDrill[] = [];
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        drillData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          creator: data.creator,
          category: data.category,
          difficulty: data.difficulty,
          tags: data.tags || [],
          steps: data.steps || [],
          totalDuration: data.totalDuration,
          estimatedShots: data.estimatedShots,
          votes: data.votes || 0,
          downloads: data.downloads || 0,
          rating: data.rating || 0,
          ratingCount: data.ratingCount || 0,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          isPublic: data.isPublic,
          featured: data.featured || false
        });
      }

      setDrills(drillData);

      // Track analytics
      await analytics.track('drill_hub_loaded', {
        userId: user?.uid,
        drillCount: drillData.length,
        sortBy,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to load public drills:', error);
      Alert.alert('Error', 'Failed to load drills');
    } finally {
      setLoading(false);
    }
  };

  const filterDrills = () => {
    let filtered = [...drills];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(drill =>
        drill.title.toLowerCase().includes(query) ||
        drill.description.toLowerCase().includes(query) ||
        drill.tags.some(tag => tag.toLowerCase().includes(query)) ||
        drill.creator.displayName.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(drill => drill.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(drill => drill.difficulty === selectedDifficulty);
    }

    // Apply additional filters
    if (activeFilter.minRating) {
      filtered = filtered.filter(drill => drill.rating >= activeFilter.minRating!);
    }

    if (activeFilter.maxDuration) {
      filtered = filtered.filter(drill => drill.totalDuration <= activeFilter.maxDuration!);
    }

    if (activeFilter.tags && activeFilter.tags.length > 0) {
      filtered = filtered.filter(drill =>
        activeFilter.tags!.some(tag => drill.tags.includes(tag))
      );
    }

    setFilteredDrills(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPublicDrills();
    setRefreshing(false);
  };

  const cloneDrill = async (drill: PublicDrill) => {
    if (!user?.uid) {
      Alert.alert('Error', 'Please sign in to clone drills');
      return;
    }

    try {
      // Check if user already has this drill
      const userDrillsRef = collection(firestore, 'users', user.uid, 'custom_drills');
      const existingQuery = query(
        userDrillsRef,
        where('originalDrillId', '==', drill.id)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        Alert.alert('Already Cloned', 'You have already cloned this drill');
        return;
      }

      // Create cloned drill
      const clonedDrill = {
        name: `${drill.title} (Cloned)`,
        description: drill.description,
        category: drill.category,
        difficulty: drill.difficulty,
        steps: drill.steps,
        totalDuration: drill.totalDuration,
        estimatedShots: drill.estimatedShots,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        originalDrillId: drill.id,
        originalCreator: drill.creator.displayName
      };

      await addDoc(userDrillsRef, clonedDrill);

      // Update download count
      const drillRef = doc(firestore, 'public_drills', drill.id);
      await updateDoc(drillRef, {
        downloads: drill.downloads + 1
      });

      // Track analytics
      await analytics.track('drill_cloned', {
        userId: user.uid,
        drillId: drill.id,
        drillTitle: drill.title,
        originalCreator: drill.creator.uid,
        timestamp: new Date().toISOString()
      });

      Alert.alert('Success', `"${drill.title}" has been added to your drills!`);

    } catch (error) {
      console.error('Failed to clone drill:', error);
      Alert.alert('Error', 'Failed to clone drill');
    }
  };

  const voteDrill = async (drill: PublicDrill, vote: 'up' | 'down') => {
    if (!user?.uid) {
      Alert.alert('Error', 'Please sign in to vote');
      return;
    }

    try {
      const drillRef = doc(firestore, 'public_drills', drill.id);
      const voteIncrement = vote === 'up' ? 1 : -1;
      
      await updateDoc(drillRef, {
        votes: drill.votes + voteIncrement
      });

      // Update local state
      setDrills(prev => prev.map(d => 
        d.id === drill.id 
          ? { ...d, votes: d.votes + voteIncrement }
          : d
      ));

      // Track analytics
      await analytics.track('drill_voted', {
        userId: user.uid,
        drillId: drill.id,
        vote,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to vote drill:', error);
      Alert.alert('Error', 'Failed to vote');
    }
  };

  const renderDrillCard = (drill: PublicDrill) => (
    <View key={drill.id} className="bg-zinc-900 rounded-2xl p-4 mb-4">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-white text-lg font-semibold mb-1">{drill.title}</Text>
          <Text className="text-zinc-400 text-sm mb-2">{drill.description}</Text>
        </View>
        {drill.featured && (
          <View className="bg-yellow-600 rounded-lg px-2 py-1">
            <Text className="text-white text-xs font-semibold">Featured</Text>
          </View>
        )}
      </View>

      {/* Creator Info */}
      <View className="flex-row items-center mb-3">
        {drill.creator.avatar ? (
          <Image 
            source={{ uri: drill.creator.avatar }} 
            className="w-6 h-6 rounded-full mr-2"
          />
        ) : (
          <View className="w-6 h-6 bg-blue-600 rounded-full mr-2 items-center justify-center">
            <Text className="text-white text-xs font-semibold">
              {drill.creator.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text className="text-zinc-300 text-sm">{drill.creator.displayName}</Text>
      </View>

      {/* Tags and Difficulty */}
      <View className="flex-row flex-wrap mb-3">
        <View className={`mr-2 px-2 py-1 rounded-lg ${
          drill.category === 'defensive' ? 'bg-red-600' :
          drill.category === 'competition' ? 'bg-blue-600' :
          drill.category === 'training' ? 'bg-green-600' : 'bg-purple-600'
        }`}>
          <Text className="text-white text-xs">{drill.category}</Text>
        </View>
        <View className={`mr-2 px-2 py-1 rounded-lg ${
          drill.difficulty === 'beginner' ? 'bg-green-600' :
          drill.difficulty === 'intermediate' ? 'bg-yellow-600' : 'bg-red-600'
        }`}>
          <Text className="text-white text-xs">{drill.difficulty}</Text>
        </View>
        {drill.tags.slice(0, 2).map((tag, index) => (
          <View key={index} className="mr-2 px-2 py-1 rounded-lg bg-zinc-700">
            <Text className="text-zinc-300 text-xs">{tag}</Text>
          </View>
        ))}
      </View>

      {/* Stats */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <ClockIcon color="#6b7280" size={16} />
          <Text className="text-zinc-400 text-sm ml-1">{drill.totalDuration}s</Text>
        </View>
        <View className="flex-row items-center">
          <UsersIcon color="#6b7280" size={16} />
          <Text className="text-zinc-400 text-sm ml-1">{drill.estimatedShots} shots</Text>
        </View>
        <View className="flex-row items-center">
          <StarIcon color="#fbbf24" size={16} />
          <Text className="text-zinc-400 text-sm ml-1">{drill.rating.toFixed(1)}</Text>
        </View>
        <View className="flex-row items-center">
          <HeartIcon color="#ef4444" size={16} />
          <Text className="text-zinc-400 text-sm ml-1">{drill.votes}</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row space-x-2">
        <Pressable
          onPress={() => cloneDrill(drill)}
          className="flex-1 bg-blue-600 rounded-xl py-2 items-center"
        >
          <CopyIcon color="white" size={16} />
        </Pressable>
        <Pressable
          onPress={() => voteDrill(drill, 'up')}
          className="bg-green-600 rounded-xl px-3 py-2"
        >
          <Text className="text-white text-sm">👍</Text>
        </Pressable>
        <Pressable
          onPress={() => voteDrill(drill, 'down')}
          className="bg-red-600 rounded-xl px-3 py-2"
        >
          <Text className="text-white text-sm">👎</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-black px-4 py-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-2xl font-bold">Drill Hub</Text>
        <Pressable
          onPress={() => setRefreshing(true)}
          className="bg-zinc-800 rounded-xl p-2"
        >
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View className="bg-zinc-900 rounded-xl p-3 mb-4 flex-row items-center">
        <SearchIcon color="#6b7280" size={20} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search drills..."
          placeholderTextColor="#6b7280"
          className="flex-1 text-white ml-3"
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row space-x-2">
          {categories.map((category) => (
            <Pressable
              key={category.value}
              onPress={() => setSelectedCategory(category.value)}
              className={`px-3 py-2 rounded-lg border ${
                selectedCategory === category.value 
                  ? 'border-white' 
                  : 'border-zinc-700'
              }`}
              style={{ backgroundColor: selectedCategory === category.value ? category.color + '20' : '#27272a' }}
            >
              <Text className={`text-sm ${
                selectedCategory === category.value ? 'text-white' : 'text-zinc-400'
              }`}>
                {category.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row space-x-2">
          {difficulties.map((difficulty) => (
            <Pressable
              key={difficulty.value}
              onPress={() => setSelectedDifficulty(difficulty.value)}
              className={`px-3 py-2 rounded-lg border ${
                selectedDifficulty === difficulty.value 
                  ? 'border-white' 
                  : 'border-zinc-700'
              }`}
              style={{ backgroundColor: selectedDifficulty === difficulty.value ? difficulty.color + '20' : '#27272a' }}
            >
              <Text className={`text-sm ${
                selectedDifficulty === difficulty.value ? 'text-white' : 'text-zinc-400'
              }`}>
                {difficulty.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Sort Options */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row space-x-2">
          {sortOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setSortBy(option.value as any)}
              className={`px-3 py-2 rounded-lg border ${
                sortBy === option.value 
                  ? 'border-white' 
                  : 'border-zinc-700'
              }`}
              style={{ backgroundColor: sortBy === option.value ? '#3b82f6' + '20' : '#27272a' }}
            >
              <Text className={`text-sm ${
                sortBy === option.value ? 'text-white' : 'text-zinc-400'
              }`}>
                {option.icon} {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Drill List */}
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View className="items-center py-8">
            <Text className="text-zinc-400 text-lg">Loading drills...</Text>
          </View>
        ) : filteredDrills.length === 0 ? (
          <View className="items-center py-8">
            <Text className="text-zinc-400 text-lg">No drills found</Text>
            <Text className="text-zinc-500 text-center mt-2">
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          filteredDrills.map(renderDrillCard)
        )}
      </ScrollView>
    </View>
  );
} 