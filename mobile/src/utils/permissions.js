import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Request camera permission with explanatory dialog
 */
export const requestCameraPermission = async () => {
  const { status: existingStatus } = await Camera.getCameraPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Camera Permission Required',
      'VibeVerse needs camera access to take photos and record videos for posts, stories, and reels. Please enable it in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
};

/**
 * Request microphone permission with explanatory dialog
 */
export const requestMicrophonePermission = async () => {
  const { status: existingStatus } = await Audio.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Microphone Permission Required',
      'VibeVerse needs microphone access for voice messages and video recording. Please enable it in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
};

/**
 * Request media library permission with explanatory dialog
 */
export const requestMediaLibraryPermission = async () => {
  const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Media Library Permission Required',
      'VibeVerse needs access to your photo library to select photos and videos for posts. Please enable it in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
};

/**
 * Request all media permissions at once
 */
export const requestAllMediaPermissions = async () => {
  const camera = await requestCameraPermission();
  const microphone = await requestMicrophonePermission();
  const mediaLibrary = await requestMediaLibraryPermission();
  return { camera, microphone, mediaLibrary };
};
