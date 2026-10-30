import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const StoryBar = ({ stories = [], onStoryPress, onAddStory, currentUserId }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add Story Button / Current User */}
        <TouchableOpacity style={styles.storyItem} onPress={onAddStory} activeOpacity={0.8}>
          <View style={styles.avatarWrapper}>
            <View style={styles.addStoryCircle}>
              <Ionicons name="camera" size={24} color="#00F5D4" />
            </View>
            <View style={styles.plusBadge}>
              <Ionicons name="add" size={14} color="#FFF" />
            </View>
          </View>
          <Text style={styles.username} numberOfLines={1}>
            Your Story
          </Text>
        </TouchableOpacity>

        {/* Stories from connections */}
        {stories.map((group, index) => {
          const hasUnviewed = group.has_unviewed;
          const user = group.user;
          const avatarUrl = user?.avatar_url;

          return (
            <TouchableOpacity
              key={user?.id || index}
              style={styles.storyItem}
              onPress={() => onStoryPress(group)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.avatarBorder,
                  hasUnviewed ? styles.unviewedBorder : styles.viewedBorder,
                ]}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <Text style={styles.placeholderInitial}>
                      {(user?.display_name || user?.username || 'V')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.username} numberOfLines={1}>
                {user?.username || 'user'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F35',
    backgroundColor: '#0F0F1A',
  },
  scrollContent: {
    paddingHorizontal: 14,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  addStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1C1C30',
    borderWidth: 2,
    borderColor: '#2A2A44',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F0F1A',
  },
  avatarBorder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  unviewedBorder: {
    borderWidth: 2.5,
    borderColor: '#FF007F',
  },
  viewedBorder: {
    borderWidth: 1.5,
    borderColor: '#4A4A68',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  placeholderAvatar: {
    backgroundColor: '#2D2D4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderInitial: {
    color: '#00F5D4',
    fontSize: 22,
    fontWeight: 'bold',
  },
  username: {
    color: '#E0E0FF',
    fontSize: 11,
    textAlign: 'center',
  },
});

export default StoryBar;
