import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Camera } from 'expo-camera/legacy';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { FILTERS } from '../../utils/filters';
import { postService } from '../../services/postService';
import { storyService } from '../../services/storyService';
import { reelService } from '../../services/reelService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CameraScreen = ({ navigation, route }) => {
  const initialMode = route.params?.mode || 'post'; // 'post', 'story', 'reel'
  const [mode, setMode] = useState(initialMode);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [capturedMedia, setCapturedMedia] = useState(null); // { uri, type: 'image' | 'video' }
  const [isRecording, setIsRecording] = useState(false);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const cameraRef = useRef(null);

  // Request native permissions on mount
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const audioStatus = await Audio.requestPermissionsAsync();
      setHasAudioPermission(audioStatus.status === 'granted');
    })();
  }, []);

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    if (mode === 'reel') {
      if (isRecording) {
        cameraRef.current.stopRecording();
        setIsRecording(false);
      } else {
        try {
          setIsRecording(true);
          const video = await cameraRef.current.recordAsync({
            maxDuration: 60,
          });
          setIsRecording(false);
          if (video && video.uri) {
            setCapturedMedia({ uri: video.uri, type: 'video' });
          }
        } catch (error) {
          console.error('Error recording reel video:', error);
          setIsRecording(false);
        }
      }
    } else {
      // Photo / Story mode
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
        if (photo && photo.uri) {
          setCapturedMedia({ uri: photo.uri, type: 'image' });
        }
      } catch (error) {
        console.error('Error capturing photo:', error);
      }
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        mode === 'reel'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.9,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setCapturedMedia({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
      });
    }
  };

  const handlePublish = async () => {
    if (!capturedMedia) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      const filename = capturedMedia.uri.split('/').pop() || 'upload.jpg';
      const fileType = capturedMedia.type === 'video' ? 'video/mp4' : 'image/jpeg';

      const fileObj = {
        uri: capturedMedia.uri,
        name: filename,
        type: fileType,
      };

      if (mode === 'story') {
        formData.append('media', fileObj);
        formData.append('media_type', capturedMedia.type);
        await storyService.createStory(formData);
        Alert.alert('Story Shared! ✨', 'Your story is live for 24 hours!');
      } else if (mode === 'reel') {
        formData.append('video', fileObj);
        formData.append('caption', caption || 'Vibe reel #vibes');
        formData.append('tags', tags || 'reels,vibeverse');
        formData.append('audio_track', 'Original Sound - VibeVerse');
        await reelService.createReel(formData);
        Alert.alert('Reel Published! 🎬', 'Your reel is now in the reels feed!');
      } else {
        // Post mode
        formData.append('image', fileObj);
        formData.append('caption', caption);
        formData.append('tags', tags);
        await postService.createPost(formData);
        Alert.alert('Post Published! 📸', 'Your vibe has been shared with your followers!');
      }

      setCapturedMedia(null);
      setCaption('');
      setTags('');
      navigation.goBack();
    } catch (error) {
      console.error('Publish error:', error);
      Alert.alert('Upload Failed', 'Could not publish content. Please verify your connection.');
    } finally {
      setIsUploading(false);
    }
  };

  if (hasCameraPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00F5D4" />
        <Text style={styles.permText}>Requesting Camera & Mic access...</Text>
      </View>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-reverse-outline" size={54} color="#FF4D4D" />
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permDesc}>
          VibeVerse needs camera and microphone access to record reels, stories, and use real-time filter effects.
        </Text>
        <TouchableOpacity
          style={styles.actionPermBtn}
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.actionPermBtnText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Preview / Publish Screen
  if (capturedMedia) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedMedia.uri }} style={styles.previewMedia} resizeMode="cover" />

        {/* Selected Filter Overlay Simulation */}
        {selectedFilter.overlay !== 'transparent' ? (
          <View
            style={[
              styles.filterOverlay,
              {
                backgroundColor: selectedFilter.overlay,
                opacity: selectedFilter.opacity,
              },
            ]}
          />
        ) : null}

        {/* Top Cancel Button */}
        <TouchableOpacity
          style={styles.cancelPreviewBtn}
          onPress={() => setCapturedMedia(null)}
          disabled={isUploading}
        >
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        {/* Publish Bottom Card */}
        <View style={styles.publishCard}>
          <Text style={styles.publishTitle}>
            Publish {mode === 'reel' ? 'Reel 🎬' : mode === 'story' ? 'Story ✨' : 'Post 📸'}
          </Text>

          {mode !== 'story' ? (
            <>
              <TextInput
                style={styles.captionInput}
                placeholder="Write a fun caption..."
                placeholderTextColor="#666688"
                value={caption}
                onChangeText={setCaption}
              />
              <TextInput
                style={styles.tagsInput}
                placeholder="Vibe tags (e.g. anime, gaming, music)..."
                placeholderTextColor="#666688"
                value={tags}
                onChangeText={setTags}
              />
            </>
          ) : (
            <Text style={styles.storyNotice}>Disappears automatically in 24 hours.</Text>
          )}

          <TouchableOpacity
            style={styles.publishBtn}
            onPress={handlePublish}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.publishBtnText}>Share to VibeVerse 🚀</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Live Camera View
  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={facing}
        flashMode={flash}
      >
        {/* Filter Overlay on Live Camera */}
        {selectedFilter.overlay !== 'transparent' ? (
          <View
            pointerEvents="none"
            style={[
              styles.filterOverlay,
              {
                backgroundColor: selectedFilter.overlay,
                opacity: selectedFilter.opacity,
              },
            ]}
          />
        ) : null}

        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBtn}>
            <Ionicons name="close" size={26} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.filterBadge}>
            <Ionicons name="sparkles" size={14} color="#00F5D4" />
            <Text style={styles.filterBadgeText}>{selectedFilter.name}</Text>
          </View>

          <View style={styles.topRightBtns}>
            <TouchableOpacity onPress={toggleFlash} style={styles.topBtn}>
              <Ionicons
                name={flash === 'on' ? 'flash' : 'flash-off'}
                size={22}
                color={flash === 'on' ? '#FFD700' : '#FFF'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFacing} style={styles.topBtn}>
              <Ionicons name="camera-reverse" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Controls Area */}
        <View style={styles.bottomControls}>
          {/* Live Filter Effects Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          >
            {FILTERS.map((filter) => {
              const isActive = selectedFilter.id === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.filterThumb, isActive && styles.activeFilterThumb]}
                  onPress={() => setSelectedFilter(filter)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.filterColorPreview,
                      { backgroundColor: filter.overlay === 'transparent' ? '#333' : filter.overlay },
                    ]}
                  />
                  <Text style={[styles.filterThumbName, isActive && styles.activeFilterThumbName]}>
                    {filter.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Mode Switcher (Post / Story / Reel) */}
          <View style={styles.modeSwitcher}>
            {['post', 'story', 'reel'].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={[styles.modeBtn, mode === m && styles.activeModeBtn]}
              >
                <Text style={[styles.modeBtnText, mode === m && styles.activeModeBtnText]}>
                  {m.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Capture Controls */}
          <View style={styles.captureRow}>
            <TouchableOpacity onPress={handlePickFromGallery} style={styles.galleryBtn}>
              <Ionicons name="images-outline" size={26} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCapture}
              style={[
                styles.captureBtn,
                mode === 'reel' && styles.reelCaptureBtn,
                isRecording && styles.recordingBtn,
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.innerCaptureCircle,
                  isRecording && styles.innerRecordingSquare,
                ]}
              />
            </TouchableOpacity>

            <View style={{ width: 44 }} />
          </View>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 45,
    zIndex: 10,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRightBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.4)',
  },
  filterBadgeText: {
    color: '#00F5D4',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomControls: {
    paddingBottom: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 14,
  },
  filterThumb: {
    alignItems: 'center',
    width: 54,
  },
  activeFilterThumb: {
    transform: [{ scale: 1.1 }],
  },
  filterColorPreview: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFF',
    marginBottom: 4,
  },
  filterThumbName: {
    color: '#BBB',
    fontSize: 11,
    textAlign: 'center',
  },
  activeFilterThumbName: {
    color: '#00F5D4',
    fontWeight: 'bold',
  },
  modeSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 16,
  },
  modeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  activeModeBtn: {
    borderBottomWidth: 2,
    borderBottomColor: '#00F5D4',
  },
  modeBtnText: {
    color: '#8A8AA5',
    fontWeight: '700',
    fontSize: 13,
  },
  activeModeBtnText: {
    color: '#00F5D4',
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  galleryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelCaptureBtn: {
    borderColor: '#FF007F',
  },
  recordingBtn: {
    borderColor: '#FF4D4D',
  },
  innerCaptureCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF',
  },
  innerRecordingSquare: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FF4D4D',
  },
  previewMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  cancelPreviewBtn: {
    position: 'absolute',
    top: 45,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  publishCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 15, 26, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: '#262642',
  },
  publishTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  captionInput: {
    backgroundColor: '#1E1E34',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    color: '#FFF',
    fontSize: 14,
    marginBottom: 10,
  },
  tagsInput: {
    backgroundColor: '#1E1E34',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    color: '#FFF',
    fontSize: 14,
    marginBottom: 16,
  },
  storyNotice: {
    color: '#00F5D4',
    fontSize: 13,
    marginBottom: 16,
  },
  publishBtn: {
    backgroundColor: '#8A2BE2',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permText: {
    color: '#8A8AA5',
    marginTop: 14,
    fontSize: 14,
  },
  permTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  permDesc: {
    color: '#8A8AA5',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  actionPermBtn: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  actionPermBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default CameraScreen;
