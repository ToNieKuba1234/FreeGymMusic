import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from '@react-navigation/native';
import {
  loadSongsFromFile,
  removeSongByUri,
  syncSongs,
  scanAndRebuild,
  SyncResult,
} from '../../utils/storage';
import Song from '../../models/Song';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { SongItem } from '@/components/SongItem';

type SyncState = 'idle' | 'picking' | 'syncing' | 'done';

//TODO: fix when after shuffling "Play" is pressed, then it should clear the shuffled song queue

export default function SongsScreen() {
  const [search, setSearch] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const { playList, currentSong, isPlaying } = useAudioPlayer();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const scanned = await scanAndRebuild();
        setSongs(scanned);
      })();
    }, [])
  );

  const refreshSongs = async () => {
    const loaded = await loadSongsFromFile();
    setSongs(loaded);
  };

  const handleSync = async () => {
    try {
      setSyncState('picking');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: false,
      });
      if (result.canceled || !result.assets?.length) {
        setSyncState('idle');
        return;
      }
      setSyncState('syncing');
      const syncResult = await syncSongs(result.assets);
      setLastSyncResult(syncResult);
      await refreshSongs();
      setSyncState('done');
      
      const lines: string[] = [];
      if (syncResult.imported.length > 0)
        lines.push(`✓ Imported: ${syncResult.imported.length} song${syncResult.imported.length > 1 ? 's' : ''}`);
      if (syncResult.skipped.length > 0)
        lines.push(`↩ Already exists: ${syncResult.skipped.length}`);
      if (syncResult.failed.length > 0)
        lines.push(`✗ Failed: ${syncResult.failed.length}`);
      
      Alert.alert('Sync complete', lines.join('\n'), [
        { text: 'OK', onPress: () => setSyncState('idle') },
      ]);
    } catch (err) {
      setSyncState('idle');
      console.error('Sync error:', err);
    }
  };

  const handleDeleteSong = (song: Song) => {
    Alert.alert(
      'Delete song',
      `"${song.title}" will be permanently removed from the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeSongByUri(song.uri);
            await refreshSongs();
          },
        },
      ]
    );
  };

  const handlePlayAll = () => { if(songs.length > 0) playList(songs, false)};

  const handleShuffle = () => {if (songs.length > 0) playList(songs, true)};

  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const isSyncing = syncState === 'picking' || syncState === 'syncing';

  return (
    <View className="flex-1 bg-black">
      <View className="px-5 pt-16 pb-4">
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-4xl font-bold text-white">Songs</Text>
          <TouchableOpacity
            onPress={handleSync}
            disabled={isSyncing}
            className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700"
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="sync-outline" size={16} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center h-11 px-3 mb-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <Ionicons name="search" size={16} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 text-base text-white"
            placeholder="Search songs…"
            placeholderTextColor="#6B7280"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handlePlayAll}
            disabled={songs.length === 0}
            className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl bg-zinc-900 border border-zinc-800"
          >
            <MaterialCommunityIcons name="play" size={22} color="#EF4444" style={{ marginRight: 6 }} />
            <Text className="text-red-500 font-semibold text-xl">Play</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShuffle}
            disabled={songs.length === 0}
            className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl border bg-zinc-900 border-zinc-800"
          >
            <MaterialCommunityIcons
              name="shuffle"
              size={22}
              color="#EF4444"
              style={{ marginRight: 6 }}
            />
            <Text className={`font-semibold text-xl text-red-500`}>
              Shuffle
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text className="px-5 pb-2 text-xs text-zinc-600 uppercase tracking-widest">
        {filtered.length} {filtered.length === 1 ? 'song' : 'songs'}
      </Text>

      {songs.length === 0 && (
        <View className="flex-1 items-center justify-center pb-32">
          <Ionicons name="musical-notes-outline" size={52} color="#3F3F46" />
          <Text className="mt-4 text-zinc-500 text-base">No songs yet</Text>
          <Text className="mt-1 text-zinc-700 text-sm">Tap Synch icon to import MP3s</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.uri}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 220, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View className="h-px bg-zinc-900" />}
        renderItem={({ item, index }) => (
          <SongItem
            song={item}
            index={index}
            isCurrent={currentSong?.uri === item.uri}
            isPlaying={isPlaying}
            isPlaylist={false}
            onPress={() => {
              playList(filtered, false, index);
            }}
            onDelete={handleDeleteSong}
          />
        )}
      />
    </View>
  );
}