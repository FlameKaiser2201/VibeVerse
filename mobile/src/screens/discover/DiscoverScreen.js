import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

const VIBE_FILTERS = [
  'All',
  'gaming',
  'coding',
  'anime',
  'music',
  'art',
  'memes',
  'photography',
  'fitness',
  'travel',
];

export const DiscoverScreen = ({ navigation }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

  const loadDiscover = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await userService.discoverUsers(1, 30);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching discover users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscover();
  }, [loadDiscover]);

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      loadDiscover();
      return;
    }
    try {
      const results = await userService.searchUsers(text.trim());
      setUsers(results || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleFollowToggle = async (targetUser) => {
    const isCurrentlyFollowing = followingMap[targetUser.id];
    setFollowingMap({ ...followingMap, [targetUser.id]: !isCurrentlyFollowing });

    try {
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(targetUser.id);
      } else {
        await userService.followUser(targetUser.id);
      }
    } catch (error) {
      // Revert on error
      setFollowingMap({ ...followingMap, [targetUser.id]: isCurrentlyFollowing });
    }
  };

  const calculateMatch = (userInterests) => {
    const myInterests = currentUser?.interests || [];
    const theirInterests = userInterests || [];
    if (myInterests.length === 0 || theirInterests.length === 0) return 65;

    const common = theirInterests.filter((v) => myInterests.includes(v));
    const percent = Math.min(100, Math.round((common.length / Math.max(1, myInterests.length)) * 100));
    return Math.max(50, percent);
  };

  const filteredUsers = users.filter((u) => {
    if (selectedVibe === 'All') return true;
    const uInterests = u.interests || [];
    return uInterests.includes(selectedVibe);
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover Like-Minded</Text>
        <Text style={styles.subtitle}>Find your tribe based on mutual vibes & passions</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#8A8AA5" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search creators or keywords..."
          placeholderTextColor="#5A5A75"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color="#8A8AA5" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Chips Horizontal List */}
      <View style={styles.vibeBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={VIBE_FILTERS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.vibeList}
          renderItem={({ item }) => {
            const isSelected = selectedVibe === item;
            return (
              <TouchableOpacity
                style={[styles.vibeChip, isSelected && styles.selectedVibeChip]}
                onPress={() => setSelectedVibe(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.vibeText, isSelected && styles.selectedVibeText]}>
                  {item === 'All' ? '✨ All Vibes' : `#${item}`}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Users List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00F5D4" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="people-outline" size={48} color="#3A3A55" />
              <Text style={styles.emptyText}>No like-minded creators found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const matchPercent = calculateMatch(item.interests);
            const isFollowing = followingMap[item.id] ?? item.is_following;
            const mutualInterests = (item.interests || []).filter((i) =>
              (currentUser?.interests || []).includes(i)
            );

            return (
              <View style={styles.userCard}>
                <View style={styles.cardTop}>
                  {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {(item.display_name || item.username || 'V')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.username}>{item.username}</Text>
                      <View style={styles.matchBadge}>
                        <Ionicons name="flame" size={12} color="#00F5D4" />
                        <Text style={styles.matchText}>{matchPercent}% Match</Text>
                      </View>
                    </View>
                    <Text style={styles.displayName}>{item.display_name}</Text>
                    {item.bio ? <Text style={styles.bioText} numberOfLines={2}>{item.bio}</Text> : null}
                  </View>
                </View>

                {/* Mutual Interests tags */}
                {mutualInterests.length > 0 ? (
                  <View style={styles.mutualRow}>
                    <Text style={styles.mutualLabel}>Shared vibes:</Text>
                    {mutualInterests.map((v, idx) => (
                      <View key={idx} style={styles.sharedChip}>
                        <Text style={styles.sharedChipText}>#{v}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Card Actions */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.followBtn, isFollowing && styles.followingBtn]}
                    onPress={() => handleFollowToggle(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isFollowing ? 'checkmark' : 'person-add'}
                      size={16}
                      color={isFollowing ? '#A0A0C0' : '#FFF'}
                    />
                    <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                      {isFollowing ? 'Following' : 'Connect'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.messageBtn}
                    onPress={() => navigation.navigate('ChatDetail', { otherUser: item })}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubble" size={16} color="#00F5D4" />
                    <Text style={styles.messageBtnText}>Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
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
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#8A8AA5',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18182E',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262642',
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  vibeBar: {
    marginBottom: 12,
  },
  vibeList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  vibeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#161628',
    borderWidth: 1,
    borderColor: '#262642',
  },
  selectedVibeChip: {
    backgroundColor: '#8A2BE2',
    borderColor: '#8A2BE2',
  },
  vibeText: {
    color: '#A0A0C0',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedVibeText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#6A6A88',
    fontSize: 15,
    marginTop: 10,
  },
  userCard: {
    backgroundColor: '#151528',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#22223C',
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  username: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  displayName: {
    color: '#8A8AA5',
    fontSize: 13,
  },
  bioText: {
    color: '#C0C0D8',
    fontSize: 13,
    marginTop: 4,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  matchText: {
    color: '#00F5D4',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mutualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#202036',
  },
  mutualLabel: {
    color: '#8A8AA5',
    fontSize: 12,
  },
  sharedChip: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.4)',
  },
  sharedChipText: {
    color: '#D4A5FF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  followBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8A2BE2',
    height: 40,
    borderRadius: 12,
  },
  followingBtn: {
    backgroundColor: '#222238',
  },
  followBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  followingBtnText: {
    color: '#A0A0C0',
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E1E34',
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  messageBtnText: {
    color: '#00F5D4',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default DiscoverScreen;
