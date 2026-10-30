import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudio } from '../hooks/useAudio';

export const VoiceRecorderModal = ({ visible, onClose, onSendVoiceNote }) => {
  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudio();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      startRecording();
      // Pulsing mic animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const handleCancel = async () => {
    await cancelRecording();
    onClose();
  };

  const handleSend = async () => {
    const audioData = await stopRecording();
    if (audioData) {
      onSendVoiceNote(audioData);
    }
    onClose();
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Recording Voice Note</Text>
          <Text style={styles.subtitle}>Microphone active • Speak naturally</Text>

          {/* Animated Glowing Mic Circle */}
          <View style={styles.micCircleContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <View style={styles.micCircle}>
              <Ionicons name="mic" size={40} color="#FFF" />
            </View>
          </View>

          {/* Time Display */}
          <Text style={styles.timer}>{formatTimer(recordingDuration)}</Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={24} color="#FF4D4D" />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.8}>
              <Ionicons name="send" size={22} color="#FFF" />
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#161626',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D4D',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#8A8AA5',
    fontSize: 13,
    marginTop: 4,
  },
  micCircleContainer: {
    marginVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 0, 127, 0.25)',
  },
  micCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FF007F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  timer: {
    color: '#00F5D4',
    fontSize: 28,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 77, 77, 0.12)',
  },
  cancelText: {
    color: '#FF4D4D',
    fontWeight: '600',
    fontSize: 14,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 22,
    backgroundColor: '#8A2BE2',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  sendText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default VoiceRecorderModal;
