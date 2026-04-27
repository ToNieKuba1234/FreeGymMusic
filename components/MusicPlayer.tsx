import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import Song from '../models/Song';

type Props = { song: Song };

export default function MusicPlayer({ song }: Props) {
  const { isPlaying, pause, resume, playNext, currentSong } = useAudioPlayer();
  const isCurrentSongPlaying = isPlaying && currentSong?.uri === song.uri;

  const togglePlayback = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await resume();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleWrapper}>
        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlayback} activeOpacity={0.7}>
          <Ionicons
            name={isCurrentSongPlaying ? 'pause' : 'play'}
            size={30}
            color="#ffffff"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext} activeOpacity={0.7}>
          <Ionicons name="play-forward" size={30} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#2c2c2e',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#3a3a3c',
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
});