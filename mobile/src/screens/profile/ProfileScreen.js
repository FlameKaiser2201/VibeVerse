import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { postService } from '../../services/postService';
import { reelService } from '../../services/reelService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = SCREEN_WIDTH / 3 - 2;

export const ProfileScreen = ({ navigation }) => {
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userReels, setUserReels] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'reels'
  const [isLoading, setIsLoading] = useState(true);

  const loadProfileData = useCallback(async () => {
    if (!authUser?.id) return;
    try {
      const [profileData, postsData, reelsData] = await Promise.all([
        userService.getProfile(authUser.id).catch(() => authUser),
        postService.getUserPosts(authUser.id).catch(() => []),
        reelService.getUserReels(authUser.id).catch(() => []),
      ]);
      setProfile(profileData || authUser);
      setUserPosts(postsData || []);
      setUserReels(reelsData || []);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of VibeVerse?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const interests = profile?.interests || authUser?.interests || [];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerUsername}>@{profile?.username || authUser?.username}</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF4D4D" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarRow}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {(profile?.display_name || profile?.username || 'V')[0].toUpperCase()}
                </Text>
              </View>
            )}

            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{profile?.posts_count || userPosts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{profile?.followers_count || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{profile?.following_count || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          {/* Bio & Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.displayName}>
              {profile?.display_name || authUser?.display_name}
            </Text>
            {profile?.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}

            {/* Vibe Chips */}
            {interests.length > 0 ? (
              <View style={styles.vibesContainer}>
                {interests.map((vibe, idx) => (
                  <View key={idx} style={styles.vibeBadge}>
                    <Text style={styles.vibeBadgeText}>#{vibe}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* Action Row */}
          <View style={styles.profileActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('Camera', { mode: 'post' })}
            >
              <Ionicons name="add-circle-outline" size={18} color="#00F5D4" />
              <Text style={styles.editBtnText}>Share New Vibe</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Selector: Posts vs Reels */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'posts' && styles.activeTabBtn]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons
              name="grid"
              size={20}
              color={activeTab === 'posts' ? '#00F5D4' : '#6A6A88'}
            />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Posts ({userPosts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'reels' && styles.activeTabBtn]}
            onPress={() => setActiveTab('reels')}
          >
            <Ionicons
              name="film"
              size={20}
              color={activeTab === 'reels' ? '#FF007F' : '#6A6A88'}
            />
            <Text style={[styles.tabText, activeTab === 'reels' && styles.activeTabText]}>
              Reels ({userReels.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Media Grid */}
        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color="#00F5D4" />
          </View>
        ) : activeTab === 'posts' ? (
          <View style={styles.gridContainer}>
            {userPosts.map((post) => (
              <View key={post.id} style={styles.gridItem}>
                {post.image_url ? (
                  <Image source={{ uri: post.image_url }} style={styles.gridImage} />
                ) : (
                  <View style={styles.textOnlyPost}>
                    <Text style={styles.textPostContent} numberOfLines={3}>
                      {post.caption}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            {userPosts.length === 0 ? (
              <View style={styles.emptyGrid}>
                <Ionicons name="images-outline" size={40} color="#33334D" />
                <Text style={styles.emptyGridText}>No posts yet</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {userReels.map((reel) => (
              <View key={reel.id} style={styles.gridItem}>
                <View style={styles.reelThumb}>
                  <Ionicons name="play" size={24} color="#FFF" />
                </View>
              </View>
            ))}
            {userReels.length === 0 ? (
              <View style={styles.emptyGrid}>
                <Ionicons name="videocam-outline" size={40} color="#33334D" />
                <Text style={styles.emptyGridText}>No reels yet</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    paddingTop: 45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  headerUsername: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsBtn: {
    padding: 6,
  },
  profileHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#00F5D4',
  },
  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00F5D4',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8A8AA5',
    fontSize: 12,
    marginTop: 2,
  },
  detailsSection: {
    marginTop: 14,
  },
  displayName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bioText: {
    color: '#C0C0D8',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  vibesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  vibeBadge: {
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  vibeBadgeText: {
    color: '#00F5D4',
    fontSize: 11,
    fontWeight: '600',
  },
  profileActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1C1C32',
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D4D',
  },
  editBtnText: {
    color: '#00F5D4',
    fontSize: 13,
    fontWeight: 'bold',
  },
  tabRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1F1F35',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F35',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  activeTabBtn: {
    borderBottomWidth: 2,
    borderBottomColor: '#00F5D4',
  },
  tabText: {
    color: '#6A6A88',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    paddingTop: 2,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    backgroundColor: '#161628',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  textOnlyPost: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A30',
  },
  textPostContent: {
    color: '#E0E0FF',
    fontSize: 11,
    textAlign: 'center',
  },
  reelThumb: {
    flex: 1,
    backgroundColor: '#1A1A30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyGrid: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyGridText: {
    color: '#555577',
    fontSize: 14,
    marginTop: 8,
  },
});

export default ProfileScreen;
