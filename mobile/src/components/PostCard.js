import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { postService } from '../services/postService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PostCard = ({ post, onCommentPress, onProfilePress }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  const user = post.user;
  const tags = post.tags || [];

  const handleLikeToggle = async () => {
    // Optimistic UI update
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await postService.likePost(post.id);
    } catch (error) {
      // Revert if error
      setIsLiked(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  return (
    <View style={styles.card}>
      {/* Post Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onProfilePress && onProfilePress(post.user_id)}
          activeOpacity={0.8}
        >
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.initialText}>
                {(user?.display_name || user?.username || 'V')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.username}>{user?.username || 'user'}</Text>
            {user?.display_name ? (
              <Text style={styles.displayName}>{user.display_name}</Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color="#8A8AA5" />
        </TouchableOpacity>
      </View>

      {/* Post Image */}
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionsBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLikeToggle} activeOpacity={0.7} style={styles.actionBtn}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={26}
              color={isLiked ? '#FF007F' : '#FFF'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onCommentPress && onCommentPress(post)}
            activeOpacity={0.7}
            style={styles.actionBtn}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={styles.actionBtn}>
            <Ionicons name="paper-plane-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Likes Count */}
      <Text style={styles.likesText}>
        {likesCount} {likesCount === 1 ? 'like' : 'likes'}
      </Text>

      {/* Caption */}
      {post.caption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>
            <Text style={styles.captionUsername}>{user?.username || 'user'} </Text>
            {post.caption}
          </Text>
        </View>
      ) : null}

      {/* Vibe Tags */}
      {tags.length > 0 ? (
        <View style={styles.tagsContainer}>
          {tags.map((tag, i) => (
            <View key={i} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* View Comments Link */}
      {(post.comments_count || 0) > 0 ? (
        <TouchableOpacity
          onPress={() => onCommentPress && onCommentPress(post)}
          style={styles.commentsLink}
        >
          <Text style={styles.viewCommentsText}>
            View all {post.comments_count} comments
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121222',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F35',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  displayName: {
    color: '#8A8AA5',
    fontSize: 12,
  },
  moreBtn: {
    padding: 6,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#0F0F1A',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    paddingVertical: 4,
  },
  likesText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  captionContainer: {
    paddingHorizontal: 14,
    marginTop: 4,
  },
  captionText: {
    color: '#E0E0FF',
    fontSize: 14,
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  tagChip: {
    backgroundColor: '#1C1C32',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E2E50',
  },
  tagText: {
    color: '#00F5D4',
    fontSize: 12,
    fontWeight: '600',
  },
  commentsLink: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  viewCommentsText: {
    color: '#8A8AA5',
    fontSize: 13,
  },
});

export default PostCard;
