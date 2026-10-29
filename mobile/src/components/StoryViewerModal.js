import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storyService } from '../services/storyService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

export const StoryViewerModal = ({ visible, storyGroup, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const stories = storyGroup?.stories || [];
  const currentStory = stories[currentIndex];
  const user = storyGroup?.user;

  useEffect(() => {
    if (!visible || !currentStory) return;

    // Record view in backend
    storyService.viewStory(currentStory.id).catch(() => {});

    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });

    return () => animation.stop();
  }, [visible, currentIndex, currentStory]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(0);
    }
  };

  if (!visible || !currentStory) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Story Media Background */}
        <Image
          source={{ uri: currentStory.media_url }}
          style={styles.storyMedia}
          resizeMode="cover"
        />

        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {stories.map((story, index) => {
            let barWidth = '0%';
            if (index < currentIndex) {
              barWidth = '100%';
            } else if (index === currentIndex) {
              return (
                <View key={story.id || index} style={styles.progressBarTrack}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              );
            }

            return (
              <View key={story.id || index} style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: barWidth }]} />
              </View>
            );
          })}
        </View>

        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(user?.display_name || user?.username || 'V')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.userName}>{user?.display_name || user?.username}</Text>
            <Text style={styles.timeAgo}>• Active Story</Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Touch zones for navigating left/right */}
        <View style={styles.touchOverlay}>
          <TouchableOpacity style={styles.touchLeft} onPress={handlePrev} activeOpacity={1} />
          <TouchableOpacity style={styles.touchRight} onPress={handleNext} activeOpacity={1} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 45,
    zIndex: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  userAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userName: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timeAgo: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  closeBtn: {
    padding: 6,
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  touchLeft: {
    flex: 1,
    height: '100%',
  },
  touchRight: {
    flex: 2,
    height: '100%',
  },
});

export default StoryViewerModal;
