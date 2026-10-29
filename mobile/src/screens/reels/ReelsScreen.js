import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { reelService } from '../../services/reelService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ReelsScreen = ({ navigation }) => {
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [likesState, setLikesState] = useState({});

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    setIsLoading(true);
    try {
      const data = await reelService.getFeed(1, 10);
      setReels(data.reels || []);
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  }).current;

  const handleLike = async (reel) => {
    const currentState = likesState[reel.id] ?? {
      liked: reel.is_liked,
      count: reel.likes_count,
    };
    const nextLiked = !currentState.liked;
    const nextCount = nextLiked ? currentState.count + 1 : Math.max(0, currentState.count - 1);

    setLikesState({
      ...likesState,
      [reel.id]: { liked: nextLiked, count: nextCount },
    });

    try {
      await reelService.likeReel(reel.id);
    } catch (e) {
      setLikesState({
        ...likesState,
        [reel.id]: currentState,
      });
    }
  };

  const renderReelItem = ({ item, index }) => {
    const isFocused = currentIndex === index;
    const user = item.user;
    const likeInfo = likesState[item.id] ?? {
      liked: item.is_liked,
      count: item.likes_count || 0,
    };

    return (
      <View style={styles.reelContainer}>
        {/* Short-form Video Player */}
        <Video
          source={{ uri: item.video_url }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isFocused}
          isLooping
          isMuted={isMuted}
        />

        {/* Right Action Bar */}
        <View style={styles.sideActions}>
          {/* Creator Avatar */}
          <TouchableOpacity style={styles.avatarAction}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {(user?.display_name || user?.username || 'V')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.addFollowBadge}>
              <Ionicons name="add" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>

          {/* Like */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleLike(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={likeInfo.liked ? 'heart' : 'heart-outline'}
              size={34}
              color={likeInfo.liked ? '#FF007F' : '#FFF'}
            />
            <Text style={styles.actionCount}>{likeInfo.count}</Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses-outline" size={30} color="#FFF" />
            <Text style={styles.actionCount}>{item.comments_count || 0}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={28} color="#FFF" />
            <Text style={styles.actionCount}>Share</Text>
          </TouchableOpacity>

          {/* Sound Mute Toggle */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setIsMuted(!isMuted)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
              size={26}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Overlay Info */}
        <View style={styles.bottomInfo}>
          <Text style={styles.username}>@{user?.username || 'creator'}</Text>
          {item.caption ? (
            <Text style={styles.caption} numberOfLines={2}>
              {item.caption}
            </Text>
          ) : null}

          {/* Audio Track Ticker */}
          <View style={styles.audioRow}>
            <Ionicons name="musical-notes" size={14} color="#00F5D4" />
            <Text style={styles.audioTrack} numberOfLines={1}>
              {item.audio_track || 'Original Audio • VibeVerse'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vibe Reels</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Camera', { mode: 'reel' })}
          style={styles.cameraShortcut}
        >
          <Ionicons name="videocam-outline" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF007F" />
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          renderItem={renderReelItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="film-outline" size={54} color="#3A3A55" />
              <Text style={styles.emptyTitle}>No reels yet</Text>
              <Text style={styles.emptyDesc}>Be the first to record a vibe reel with filters!</Text>
              <TouchableOpacity
                style={styles.createReelBtn}
                onPress={() => navigation.navigate('Camera', { mode: 'reel' })}
              >
                <Text style={styles.createReelBtnText}>Record Reel 🎬</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 45,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cameraShortcut: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 60, // Account for bottom tab
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  sideActions: {
    position: 'absolute',
    right: 14,
    bottom: 40,
    alignItems: 'center',
    gap: 16,
    zIndex: 5,
  },
  avatarAction: {
    position: 'relative',
    marginBottom: 6,
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  addFollowBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF007F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 80,
    zIndex: 5,
  },
  username: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  caption: {
    color: '#E0E0FF',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  audioTrack: {
    color: '#00F5D4',
    fontSize: 12,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 14,
  },
  emptyDesc: {
    color: '#8A8AA5',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  createReelBtn: {
    backgroundColor: '#FF007F',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  createReelBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default ReelsScreen;
