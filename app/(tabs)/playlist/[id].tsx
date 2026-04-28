import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  Alert, Modal, Image, Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  loadPlaylists, loadSongsFromFile,
  addSongToPlaylist, removeSongFromPlaylist,
  saveArtwork, updatePlaylistArtwork,
} from '../../../utils/storage';
import Song from '../../../models/Song';
import Playlist from '../../../models/Playlist';
import { useAudioPlayer } from '../../../context/AudioPlayerContext';
import { SongItem } from '@/components/SongItem';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { playSong, currentSong, isPlaying } = useAudioPlayer();
  const scrollY = useRef(new Animated.Value(0)).current;

  const refresh = useCallback(async () => {
    const [playlists, all] = await Promise.all([loadPlaylists(), loadSongsFromFile()]);
    const found = playlists.find(p => p.id === id) ?? null;
    setPlaylist(found);
    setAllSongs(all);
    if (found) setSongs(all.filter(s => found.songUris.includes(s.uri)));
  }, [id]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleChangeArtwork = () => {
    Alert.alert('Change playlist cover', 'Select source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo library', onPress: pickImage },
      ...(playlist?.artwork ? [{ 
        text: 'Remove cover', 
        style: 'destructive' as const,
        onPress: async () => {
          await updatePlaylistArtwork(id, undefined);
          refresh();
        }
      }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) {
      const saved = await saveArtwork(result.assets[0].uri, id);
      await updatePlaylistArtwork(id, saved);
      refresh();
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) {
      const saved = await saveArtwork(result.assets[0].uri, id);
      await updatePlaylistArtwork(id, saved);
      refresh();
    }
  };

  const openAddModal = () => { setSelected(new Set()); setAddModalVisible(true); };
  
  const toggleSelect = (uri: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(uri) ? next.delete(uri) : next.add(uri);
      return next;
    });
  };

  const handleConfirmAdd = async () => {
    for (const uri of selected) await addSongToPlaylist(id, uri);
    setAddModalVisible(false);
    refresh();
  };

  const handleRemove = (song: Song) => {
    Alert.alert('Usuń', `Usunąć "${song.title}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: async () => { await removeSongFromPlaylist(id, song.uri); refresh(); } },
    ]);
  };

  const handlePlayAll = () => songs.length > 0 && playSong(songs[0]);
  const handleShuffle = () => songs.length > 0 && playSong(songs[Math.floor(Math.random() * songs.length)]);

  const songsNotInPlaylist = allSongs.filter(s => !playlist?.songUris.includes(s.uri));

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [240, 280],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View className="flex-1 bg-black">
      <View className="absolute top-0 left-0 right-0 z-50 pt-14 pb-4 px-5 flex-row items-center bg-black">
        <TouchableOpacity onPress={() => router.back()} className="mr-3" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>

        <Animated.Text 
          className="text-white text-xl font-bold flex-1" 
          style={{ opacity: headerTitleOpacity }}
          numberOfLines={1}
        >
          {playlist?.name}
        </Animated.Text>

        <TouchableOpacity
          onPress={openAddModal}
          className="flex-row items-center px-4 py-2 rounded-full bg-[#27272a] border border-[#3f3f46]"
        >
          <Ionicons name="add" size={18} color="#EF4444" />
          <Text className="text-[#EF4444] text-sm font-semibold ml-1.5">Add Songs</Text>
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        data={songs}
        keyExtractor={(item) => item.uri}
        ItemSeparatorComponent={() => <View className="h-px bg-zinc-900" />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 220 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        ListHeaderComponent={
          <View className="pt-32 px-5 items-center">
            <TouchableOpacity onPress={handleChangeArtwork} className="mb-6 shadow-2xl">
              {playlist?.artwork ? (
                <Image source={{ uri: playlist.artwork }} className="w-72 h-72 rounded-[28px]" />
              ) : (
                <View className="w-60 h-60 rounded-[28px] bg-[#27272a] border-[1.5px] border-[#3f3f46] border-dashed items-center justify-center">
                  <Ionicons name="camera-outline" size={48} color="#52525b" />
                  <Text className="text-[#52525b] text-sm mt-2 font-medium">Add photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text className="text-white text-3xl font-extrabold text-center mb-1">
              {playlist?.name}
            </Text>

            <Text className="text-[#52525b] text-xs uppercase tracking-[2px] text-center mb-8">
              {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            </Text>

            <View className="flex-row gap-3 mb-8">
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
                <Text className="font-semibold text-xl text-red-500">
                  Shuffle
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <SongItem
            song={item}
            index={index}
            isCurrent={currentSong?.uri === item.uri}
            isPlaying={isPlaying}
            isPlaylist={false}
            onPress={playSong}
            onDelete={handleRemove}
          />
        )}
      />

      {/* MODAL pozostaje bez zmian */}
      <Modal 
        visible={addModalVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1c1c1e', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 40, maxHeight: '80%' }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#3a3a3c', alignSelf: 'center', marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 }}>
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}>Add Songs</Text>
              {selected.size > 0 && <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '600' }}>{selected.size} selected</Text>}
            </View>
            {songsNotInPlaylist.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text style={{ color: '#71717a' }}>All songs already added</Text>
              </View>
            ) : (
              <FlatList
                data={songsNotInPlaylist}
                keyExtractor={item => item.uri}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#27272a' }} />}
                renderItem={({ item }) => {
                  const isSelected = selected.has(item.uri);
                  return (
                    <TouchableOpacity onPress={() => toggleSelect(item.uri)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: isSelected ? '#EF4444' : '#52525b', backgroundColor: isSelected ? '#EF4444' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                      </View>
                      <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '500', flex: 1 }} numberOfLines={1}>{item.title}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
            <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 16 }}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#27272a', alignItems: 'center' }}>
                <Text style={{ color: '#a1a1aa', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmAdd} disabled={selected.size === 0} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: selected.size > 0 ? '#EF4444' : '#3f3f46', alignItems: 'center' }}>
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 16 }}>
                  Add Songs{selected.size > 0 ? ` (${selected.size})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}