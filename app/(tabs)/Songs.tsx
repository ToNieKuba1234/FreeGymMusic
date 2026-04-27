import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';

import { loadSongsFromFile, removeSongByUri } from '../../utils/storage';
import Song from '../../models/Song';
import { useAudioPlayer } from '../../context/AudioPlayerContext';

export default function SongsScreen() {
  const [search, setSearch] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const { playSong, currentSong } = useAudioPlayer();

  const refreshSongs = async () => {
    const loadedSongs = await loadSongsFromFile();
    setSongs(loadedSongs);
  };

  useFocusEffect(
    useCallback(() => {
      refreshSongs();
    }, [])
  );

  const filteredSongs = songs.filter(song =>
    (song.title + ' ' + song.artist).toLowerCase().includes(search.toLowerCase())
  );

  const handlePlayButton = () => {
    if (songs.length > 0) {
      playSong(songs[0]);
    }
  };

  const deleteFile = async (uri: string) => {
    try {
      const fileUri = uri.startsWith('file://') ? uri : 'file://' + uri;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    } catch (_) {}
  };

  const deleteSong = async (song: Song) => {
    await deleteFile(song.uri);
    await removeSongByUri(song.uri);
  };

  const handleDeleteSong = async (song: Song) => {
    Alert.alert(
      `Uwaga! Usuwasz piosenkę "${song.title}"!`,
      `Jesteś pewny?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            await deleteSong(song);
            await refreshSongs();
          }
        }
      ]
    );
  };

  const handlePlaySong = (song: Song) => {
    playSong(song);
  };

  return (
    <View className="flex-1 px-4 pt-16 bg-black">
      <Text className="mb-4 text-4xl font-bold text-white">Songs</Text>

      <View className="flex-row items-center h-12 px-3 mb-6 rounded-xl bg-zinc-900">
        <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          className="flex-1 text-lg text-white"
          placeholder="Find in songs"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View className="flex-row justify-between mb-4">
        <TouchableOpacity onPress={handlePlayButton} className="flex-row items-center justify-center w-[170px] py-2 rounded-lg bg-zinc-900">
          <MaterialCommunityIcons name="play" size={28} color="#EF4444" style={{ marginRight: 6 }} />
          <Text className="text-[#EF4444] text-xl">Play</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center justify-center w-[170px] py-2 rounded-lg bg-zinc-900">
          <MaterialCommunityIcons name="shuffle" size={26} color="#EF4444" style={{ marginRight: 6 }} />
          <Text className="text-[#EF4444] text-xl">Shuffle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.uri}
        className="mb-24"
        renderItem={({ item }) => {
          const isCurrent = currentSong?.uri === item.uri;

          return (
            <TouchableOpacity
              onPress={() => handlePlaySong(item)}
              className="flex-row items-center justify-between p-6 mb-2 border-b rounded-md border-zinc-700"
            >
              <View>
                <Text
                  className={`text-lg font-semibold ${
                    isCurrent ? 'text-[#EF4444]' : 'text-white'
                  }`}
                >
                  {item.title}
                </Text>
                <Text className="text-sm text-zinc-500">{item.artist}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteSong(item)}>
                <Ionicons name="trash" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}