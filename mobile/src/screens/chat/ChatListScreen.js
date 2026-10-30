import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { messageService } from '../../services/messageService';

export const ChatListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadConversations();
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => navigation.navigate('Discover')}
        >
          <Ionicons name="create-outline" size={22} color="#00F5D4" />
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversation_id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#00F5D4"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={44} color="#00F5D4" />
              </View>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Discover like-minded friends and send a text or voice message to start vibing!
              </Text>
              <TouchableOpacity
                style={styles.findPeopleBtn}
                onPress={() => navigation.navigate('Discover')}
              >
                <Text style={styles.findPeopleText}>Discover Friends 🌌</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const other = item.other_user;
            const lastMsg = item.last_message;
            const hasUnread = (item.unread_count || 0) > 0;

            return (
              <TouchableOpacity
                style={styles.convItem}
                onPress={() => navigation.navigate('ChatDetail', { otherUser: other })}
                activeOpacity={0.7}
              >
                {/* Avatar */}
                {other?.avatar_url ? (
                  <Image source={{ uri: other.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {(other?.display_name || other?.username || 'V')[0].toUpperCase()}
                    </Text>
                  </View>
                )}

                {/* Content */}
                <View style={styles.convContent}>
                  <View style={styles.topRow}>
                    <Text style={[styles.name, hasUnread && styles.boldText]}>
                      {other?.display_name || other?.username}
                    </Text>
                    <Text style={styles.timestamp}>{formatTime(item.updated_at)}</Text>
                  </View>

                  <View style={styles.bottomRow}>
                    <Text
                      style={[styles.lastMessage, hasUnread && styles.unreadMessage]}
                      numberOfLines={1}
                    >
                      {lastMsg?.message_type === 'voice'
                        ? '🎤 Voice note'
                        : lastMsg?.content || 'Started a conversation'}
                    </Text>

                    {hasUnread ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>{item.unread_count}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  newChatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E1E34',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#161628',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  convContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#00F5D4',
  },
  timestamp: {
    color: '#707090',
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    color: '#8A8AA5',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: '#FFF',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#FF007F',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1E1E34',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#00F5D4',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#8A8AA5',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  findPeopleBtn: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  findPeopleText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ChatListScreen;
