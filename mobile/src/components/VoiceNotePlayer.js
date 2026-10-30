import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

export const VoiceNotePlayer = ({ audioUrl, isSelf }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMillis, setDurationMillis] = useState(0);
  const [positionMillis, setPositionMillis] = useState(0);
  const waveAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      waveAnim.setValue(0.3);
    }
  }, [isPlaying]);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPositionMillis(status.positionMillis);
      setDurationMillis(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPositionMillis(0);
      }
    }
  };

  const handlePlayPause = async () => {
    try {
      if (sound === null) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      } else {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          if (positionMillis >= durationMillis && durationMillis > 0) {
            await sound.replayAsync();
          } else {
            await sound.playAsync();
          }
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error toggling voice note playback:', error);
    }
  };

  const formatTime = (millis) => {
    const totalSecs = Math.floor(millis / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0;

  return (
    <View style={[styles.container, isSelf ? styles.selfContainer : styles.otherContainer]}>
      <TouchableOpacity
        style={[styles.playBtn, isSelf ? styles.selfPlayBtn : styles.otherPlayBtn]}
        onPress={handlePlayPause}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={18}
          color={isSelf ? '#0F0F1A' : '#FFF'}
        />
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        {/* Animated Soundwave bars */}
        <View style={styles.waveformBars}>
          {[40, 75, 55, 90, 65, 80, 45, 85, 60, 70].map((height, i) => (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  height: height * 0.22,
                  backgroundColor: isSelf ? '#00F5D4' : '#8A2BE2',
                  transform: isPlaying ? [{ scaleY: waveAnim }] : [],
                },
              ]}
            />
          ))}
        </View>

        {/* Progress track */}
        <View style={styles.track}>
          <View style={[styles.progress, { width: `${progressPercent}%` }]} />
        </View>

        <Text style={[styles.durationText, isSelf ? styles.selfDurationText : styles.otherDurationText]}>
          {formatTime(positionMillis || durationMillis)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 16,
    minWidth: 190,
  },
  selfContainer: {
    backgroundColor: '#8A2BE2',
  },
  otherContainer: {
    backgroundColor: '#1E1E34',
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selfPlayBtn: {
    backgroundColor: '#00F5D4',
  },
  otherPlayBtn: {
    backgroundColor: '#8A2BE2',
  },
  waveformContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 20,
    marginBottom: 4,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  track: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progress: {
    height: '100%',
    backgroundColor: '#00F5D4',
  },
  durationText: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: '600',
  },
  selfDurationText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  otherDurationText: {
    color: '#A0A0C0',
  },
});

export default VoiceNotePlayer;
