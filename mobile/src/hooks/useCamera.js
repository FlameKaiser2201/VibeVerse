import { useState, useRef, useCallback } from 'react';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { requestCameraPermission, requestMediaLibraryPermission } from '../utils/permissions';

export const useCamera = () => {
  const cameraRef = useRef(null);
  const [facing, setFacing] = useState('back');
  const [isRecording, setIsRecording] = useState(false);
  const [flashMode, setFlashMode] = useState('off');

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlashMode((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return null;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });
      return photo;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return null;
    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: 60,
        quality: Camera.Constants?.VideoQuality?.['720p'] || '720p',
      });
      setIsRecording(false);
      return video;
    } catch (error) {
      console.error('Error recording video:', error);
      setIsRecording(false);
      return null;
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  }, [isRecording]);

  const pickFromGallery = useCallback(async (mediaType = 'Images') => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType === 'Videos'
          ? ImagePicker.MediaTypeOptions.Videos
          : mediaType === 'All'
          ? ImagePicker.MediaTypeOptions.All
          : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: mediaType === 'Videos' ? [9, 16] : [1, 1],
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets?.[0]) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error picking from gallery:', error);
      return null;
    }
  }, []);

  return {
    cameraRef,
    facing,
    flashMode,
    isRecording,
    toggleFacing,
    toggleFlash,
    takePicture,
    startRecording,
    stopRecording,
    pickFromGallery,
  };
};

export default useCamera;
