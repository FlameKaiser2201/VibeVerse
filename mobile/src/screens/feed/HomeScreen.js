import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services/postService';
import { storyService } from '../../services/storyService';
import { StoryBar } from '../../components/StoryBar';
import { StoryViewerModal } from '../../components/StoryViewerModal';
import { PostCard } from '../../components/PostCard';

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [storyModalVisible, setStoryModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [feedData, storiesData] = await Promise.all([
        postService.getFeed(1, 20).catch(() => []),
        storyService.getFeed().catch(() => []),
      ]);
      setPosts(feedData || []);
      setStories(storiesData || []);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleStoryPress = (group) => {
    setActiveStoryGroup(group);
    setStoryModalVisible(true);
  };

  const handleAddStory = () => {
    navigation.navigate('Camera', { mode: 'story' });
  };

  const renderHeader = () => (
    <View>
      {/* 24-Hour Stories Bar */}
      <StoryBar
        stories={stories}
        onStoryPress={handleStoryPress}
        onAddStory={handleAddStory}
        currentUserId={user?.id}
      />
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="sparkles" size={36} color="#00F5D4" />
        </View>
        <Text style={styles.emptyTitle}>Welcome to VibeVerse!</Text>
        <Text style={styles.emptySubtitle}>
          Connect with like-minded creators to populate your feed, or snap your first photo!
        </Text>
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => navigation.navigate('Discover')}
          activeOpacity={0.8}
        >
          <Ionicons name="compass-outline" size={18} color="#FFF" />
          <Text style={styles.exploreBtnText}>Find Like-Minded People</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.appBar}>
        <View style={styles.brandRow}>
          <Ionicons name="planet" size={26} color="#00F5D4" />
          <Text style={styles.appTitle}>VibeVerse</Text>
        </View>

        <View style={styles.appBarActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Camera', { mode: 'post' })}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('ChatList')}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Posts Feed */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onCommentPress={(p) => {}}
              onProfilePress={(userId) => {}}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#00F5D4"
              colors={['#8A2BE2', '#00F5D4']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Ephemeral Story Viewer Modal */}
      <StoryViewerModal
        visible={storyModalVisible}
        storyGroup={activeStoryGroup}
        onClose={() => setStoryModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 12,
    backgroundColor: '#0F0F1A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C1C30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E1E34',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#00F5D4',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8A8AA5',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 22,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  exploreBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default HomeScreen;
