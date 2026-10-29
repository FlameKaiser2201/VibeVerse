import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/messageService';
import { VoiceNotePlayer } from '../../components/VoiceNotePlayer';
import { VoiceRecorderModal } from '../../components/VoiceRecorderModal';

export const ChatDetailScreen = ({ route, navigation }) => {
  const { otherUser } = route.params || {};
  const { user: currentUser } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  const flatListRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!otherUser?.id) return;
    try {
      const data = await messageService.getMessages(otherUser.id, 1);
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [otherUser?.id]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 4000); // Polling update fallback
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const content = inputText.trim();
    setInputText('');

    // Optimistic message bubble
    const tempMsg = {
      id: `temp_${Date.now()}`,
      sender_id: currentUser?.id,
      receiver_id: otherUser?.id,
      content,
      message_type: 'text',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await messageService.sendMessage(otherUser.id, content, 'text');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Send Failed', 'Could not deliver message');
    }
  };

  const handleSendVoiceNote = async (recordedAudio) => {
    if (!recordedAudio || !recordedAudio.uri) return;

    try {
      const formData = new FormData();
      const filename = recordedAudio.uri.split('/').pop() || 'voice_note.m4a';

      formData.append('audio', {
        uri: recordedAudio.uri,
        name: filename,
        type: 'audio/m4a',
      });
      formData.append('receiver_id', otherUser.id);
      if (recordedAudio.duration) {
        formData.append('duration', recordedAudio.duration);
      }

      // Optimistic message bubble
      const tempVoiceMsg = {
        id: `temp_voice_${Date.now()}`,
        sender_id: currentUser?.id,
        receiver_id: otherUser?.id,
        content: '🎤 Voice note',
        media_url: recordedAudio.uri,
        message_type: 'voice',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempVoiceMsg]);

      await messageService.sendVoiceMessage(otherUser.id, formData);
    } catch (error) {
      console.error('Error uploading voice message:', error);
      Alert.alert('Voice Note Failed', 'Could not upload microphone recording.');
    }
  };

  const renderMessageItem = ({ item }) => {
    const isSelf = item.sender_id === currentUser?.id;
    const isVoice = item.message_type === 'voice';

    return (
      <View style={[styles.bubbleRow, isSelf ? styles.selfRow : styles.otherRow]}>
        {!isSelf && (
          otherUser?.avatar_url ? (
            <Image source={{ uri: otherUser.avatar_url }} style={styles.bubbleAvatar} />
          ) : (
            <View style={styles.bubbleAvatarFallback}>
              <Text style={styles.avatarInitial}>
                {(otherUser?.display_name || otherUser?.username || 'V')[0].toUpperCase()}
              </Text>
            </View>
          )
        )}

        {isVoice ? (
          <VoiceNotePlayer audioUrl={item.media_url} isSelf={isSelf} />
        ) : (
          <View style={[styles.bubble, isSelf ? styles.selfBubble : styles.otherBubble]}>
            <Text style={[styles.bubbleText, isSelf ? styles.selfText : styles.otherText]}>
              {item.content}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerUser}>
          {otherUser?.avatar_url ? (
            <Image source={{ uri: otherUser.avatar_url }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.avatarInitial}>
                {(otherUser?.display_name || otherUser?.username || 'V')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{otherUser?.display_name || otherUser?.username}</Text>
            <Text style={styles.headerStatus}>Connected • Active</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerCallBtn}>
          <Ionicons name="call-outline" size={22} color="#00F5D4" />
        </TouchableOpacity>
      </View>

      {/* Message History */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00F5D4" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Input Bottom Bar */}
      <View style={styles.inputBar}>
        {/* Camera Shortcut */}
        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => navigation.navigate('Camera', { mode: 'post' })}
        >
          <Ionicons name="camera-outline" size={24} color="#8A8AA5" />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder="Message with good vibes..."
          placeholderTextColor="#5A5A75"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />

        {/* Microphone Voice Note Button OR Text Send Button */}
        {inputText.trim().length > 0 ? (
          <TouchableOpacity style={styles.sendBtn} onPress={handleSendText} activeOpacity={0.8}>
            <Ionicons name="arrow-up" size={20} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.micBtn}
            onPress={() => setVoiceModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="mic" size={22} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Microphone Voice Recording Modal */}
      <VoiceRecorderModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onSendVoiceNote={handleSendVoiceNote}
      />
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerStatus: {
    color: '#00F5D4',
    fontSize: 11,
  },
  headerCallBtn: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  selfRow: {
    justifyContent: 'flex-end',
  },
  otherRow: {
    justifyContent: 'flex-start',
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 4,
  },
  bubbleAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  selfBubble: {
    backgroundColor: '#8A2BE2',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#1E1E34',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 19,
  },
  selfText: {
    color: '#FFF',
  },
  otherText: {
    color: '#E0E0FF',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#141424',
    borderTopWidth: 1,
    borderTopColor: '#202036',
    gap: 10,
  },
  actionIconBtn: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1C1C30',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#00F5D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF007F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default ChatDetailScreen;
