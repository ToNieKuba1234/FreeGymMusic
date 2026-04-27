import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import Song from '../models/Song';

type Props = {
  song: Song;
};

export default function MusicPlayer({ song }: Props) {
  const { isPlaying, playSong, pause, resume, playNext, playPrevious, currentSong } = useAudioPlayer();

  const isCurrentSongPlaying = isPlaying && currentSong?.uri === song.uri;

  const togglePlayback = async () => {
    if(currentSong?.uri !== song.uri) {
      await playSong(song);
    } else {
      if (isPlaying) {
        await pause();
      } else {
        await resume();
      }
    }
  };

  return (
    <View className="absolute flex-row items-center justify-between bottom-4 left-2 right-2 rounded-2xl bg-zinc-900" style={{ paddingVertical: 16, paddingHorizontal: 24 }}>
      <View style={{ minWidth: 150 }}>
        <Text className="text-base font-semibold text-white">{song.title}</Text>
        <Text className="text-sm text-zinc-400">{song.artist}</Text>
      </View>

      <View className="flex-row items-center" style={{ marginLeft: 40, gap: 18 }}>
        <TouchableOpacity onPress={playPrevious}>
          <Ionicons name="play-skip-back" size={20} color="#EF4444" />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayback} className={"w-10 h-10 rounded-full bg-[#EF4444] flex justify-center items-center"}>
          <Ionicons
            name={isCurrentSongPlaying ? 'pause' : 'play'}
            size={20}
            color="#18181b"
          />
        </TouchableOpacity>


        <TouchableOpacity onPress={playNext}>
          <Ionicons name="play-skip-forward" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
