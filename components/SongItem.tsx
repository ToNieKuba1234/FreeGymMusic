import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Song from '../models/Song';

interface SongItemProps {
  song: Song;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  isPlaylist: boolean;
  onPress: (song: Song) => void;
  onDelete: (song: Song) => void;
}

export const SongItem = ({ song, index, isCurrent, isPlaying, isPlaylist, onPress, onDelete }: SongItemProps) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(song)}
      activeOpacity={0.7}
      className="flex-row items-center py-7"
    >
      <View className="w-8 items-center mr-3">
        {isCurrent ? (
          <Ionicons
            name={isPlaying ? 'volume-high' : 'pause'}
            size={16}
            color="#EF4444"
          />
        ) : (
          <Text className="text-zinc-600 text-sm">{index + 1}</Text>
        )}
      </View>
      
      <View className="flex-1">
        <Text
          className={`text-xl font-semibold ${isCurrent ? 'text-red-500' : 'text-white'}`}
          numberOfLines={1}
        >
          {song.title}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => onDelete(song)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        className="ml-3 p-1"
      >
        <Ionicons name={isPlaylist ? 'remove-circle-outline' : 'trash-outline'} size={18} color="#52525B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};