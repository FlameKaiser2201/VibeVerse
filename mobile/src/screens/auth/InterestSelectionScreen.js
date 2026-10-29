import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const AVAILABLE_VIBES = [
  { id: 'gaming', label: 'Gaming', icon: 'game-controller' },
  { id: 'coding', label: 'Coding & Tech', icon: 'code-slash' },
  { id: 'anime', label: 'Anime & Manga', icon: 'sparkles' },
  { id: 'music', label: 'Music & Beats', icon: 'musical-notes' },
  { id: 'art', label: 'Art & Design', icon: 'color-palette' },
  { id: 'memes', label: 'Memes & Humor', icon: 'happy' },
  { id: 'photography', label: 'Photography', icon: 'camera' },
  { id: 'travel', label: 'Travel & Trips', icon: 'airplane' },
  { id: 'fitness', label: 'Fitness & Gym', icon: 'barbell' },
  { id: 'fashion', label: 'Fashion & Style', icon: 'shirt' },
  { id: 'food', label: 'Foodie & Cooking', icon: 'restaurant' },
  { id: 'cinema', label: 'Cinema & Series', icon: 'film' },
  { id: 'space', label: 'Sci-Fi & Cosmos', icon: 'planet' },
  { id: 'dance', label: 'Dance & Vibes', icon: 'flame' },
  { id: 'books', label: 'Books & Writing', icon: 'book' },
  { id: 'cars', label: 'Cars & Speed', icon: 'car-sport' },
];

export const InterestSelectionScreen = ({ route, navigation }) => {
  const { username, email, displayName, password } = route.params || {};
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();

  const toggleVibe = (vibeId) => {
    if (selectedVibes.includes(vibeId)) {
      setSelectedVibes(selectedVibes.filter((v) => v !== vibeId));
    } else {
      setSelectedVibes([...selectedVibes, vibeId]);
    }
  };

  const handleFinish = async () => {
    if (selectedVibes.length < 3) {
      setErrorMessage('Please pick at least 3 vibes so we can match you with like-minded friends!');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    const result = await register(username, email, password, selectedVibes);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Pick Your Vibes ✨</Text>
        <Text style={styles.subtitle}>
          Choose 3 or more interests to discover like-minded people who share your vibe.
        </Text>
      </View>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Ionicons name="information-circle" size={18} color="#00F5D4" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.chipsContainer}>
        {AVAILABLE_VIBES.map((vibe) => {
          const isSelected = selectedVibes.includes(vibe.id);
          return (
            <TouchableOpacity
              key={vibe.id}
              style={[styles.vibeChip, isSelected && styles.selectedChip]}
              onPress={() => toggleVibe(vibe.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={vibe.icon}
                size={18}
                color={isSelected ? '#0F0F1A' : '#00F5D4'}
              />
              <Text style={[styles.vibeLabel, isSelected && styles.selectedLabel]}>
                {vibe.label}
              </Text>
              {isSelected ? (
                <Ionicons name="checkmark-circle" size={16} color="#0F0F1A" />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Floating Bottom Action */}
      <View style={styles.bottomBar}>
        <Text style={styles.countText}>
          {selectedVibes.length} selected {selectedVibes.length >= 3 ? '🎉' : '(min 3)'}
        </Text>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            selectedVibes.length < 3 && styles.disabledBtn,
          ]}
          onPress={handleFinish}
          disabled={isLoading || selectedVibes.length < 3}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Start Vibing 🚀</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E34',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#8A8AA5',
    marginTop: 6,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  errorText: {
    color: '#00F5D4',
    fontSize: 13,
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 110,
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#18182E',
    borderWidth: 1.5,
    borderColor: '#2D2D4D',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  selectedChip: {
    backgroundColor: '#00F5D4',
    borderColor: '#00F5D4',
  },
  vibeLabel: {
    color: '#E0E0FF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedLabel: {
    color: '#0F0F1A',
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#141424',
    borderTopWidth: 1,
    borderTopColor: '#262642',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countText: {
    color: '#8A8AA5',
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: '#3A3A52',
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default InterestSelectionScreen;
