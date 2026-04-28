import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Image,
  Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  loadPlaylists, createPlaylist, deletePlaylist,
  renamePlaylist, saveArtwork,
} from '../../utils/storage';
import Playlist from '../../models/Playlist';

export default function PlaylistsScreen() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [pendingArtwork, setPendingArtwork] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    loadPlaylists().then(setPlaylists);
  }, []));

  const refresh = () => loadPlaylists().then(setPlaylists);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPendingArtwork(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPendingArtwork(result.assets[0].uri);
  };

  const showImageOptions = () => {
    Alert.alert('Playlist Cover', 'Select source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const playlist = await createPlaylist(newName.trim());
    if (pendingArtwork) {
      const saved = await saveArtwork(pendingArtwork, playlist.id);
      const playlists = await loadPlaylists();
      const { updatePlaylistArtwork } = await import('../../utils/storage');
      await updatePlaylistArtwork(playlist.id, saved);
    }
    setNewName('');
    setPendingArtwork(null);
    setModalVisible(false);
    refresh();
  };

  const handleRename = async () => {
    if (!newName.trim() || !renamingId) return;
    await renamePlaylist(renamingId, newName.trim());
    setNewName('');
    setRenamingId(null);
    setRenameModalVisible(false);
    refresh();
  };

  const handleDelete = (playlist: Playlist) => {
    Alert.alert(
      'Delete playlist',
      `"${playlist.name}" will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => { await deletePlaylist(playlist.id); refresh(); } },
      ]
    );
  };

  const openRename = (playlist: Playlist) => {
    setRenamingId(playlist.id);
    setNewName(playlist.name);
    setRenameModalVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 64, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ color: '#ffffff', fontSize: 34, fontWeight: '700' }}>Playlists</Text>
          <TouchableOpacity
            onPress={() => { setNewName(''); setPendingArtwork(null); setModalVisible(true); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#27272a', borderWidth: 1, borderColor: '#3f3f46' }}
          >
            <Ionicons name="add" size={20} color="#EF4444"/>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={{ paddingHorizontal: 20, paddingBottom: 8, fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: 1.5 }}>
        {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
      </Text>

      {playlists.length === 0 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
          <MaterialCommunityIcons name="playlist-music-outline" size={52} color="#3f3f46" />
          <Text style={{ marginTop: 16, color: '#71717a', fontSize: 16 }}>No playlists yet</Text>
          <Text style={{ marginTop: 4, color: '#3f3f46', fontSize: 14 }}>Tap + to create one</Text>
        </View>
      )}

      <FlatList
        data={playlists}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 220 }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#18181b' }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`../playlist/${item.id}`)}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
          >
            {/* Artwork */}
            {item.artwork ? (
              <Image source={{ uri: item.artwork }} style={{ width: 48, height: 48, borderRadius: 10, marginRight: 14 }} />
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <MaterialCommunityIcons name="playlist-play" size={26} color="#EF4444" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }} numberOfLines={1}>{item.name}</Text>
              <Text style={{ color: '#71717a', fontSize: 13, marginTop: 2 }}>
                {item.songUris.length} {item.songUris.length === 1 ? 'song' : 'songs'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={() => openRename(item)} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
                <Ionicons name="pencil-outline" size={18} color="#52525b" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={18} color="#52525b" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Create modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', paddingHorizontal: 24 }}>
            <View style={{ backgroundColor: '#1c1c1e', borderRadius: 24, padding: 24, borderWidth: 0.5, borderColor: '#3a3a3c' }}>
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 20 }}>New Playlist</Text>

              {/* Artwork picker */}
              <TouchableOpacity onPress={showImageOptions} style={{ alignSelf: 'center', marginBottom: 20 }}>
                {pendingArtwork ? (
                  <Image source={{ uri: pendingArtwork }} style={{ width: 100, height: 100, borderRadius: 16 }} />
                ) : (
                  <View style={{ width: 100, height: 100, borderRadius: 16, backgroundColor: '#27272a', borderWidth: 1.5, borderColor: '#3f3f46', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="camera-outline" size={28} color="#52525b" />
                    <Text style={{ color: '#52525b', fontSize: 11 }}>Add photo</Text>
                  </View>
                )}
                {pendingArtwork && (
                  <View style={{ position: 'absolute', bottom: -8, right: -8, backgroundColor: '#EF4444', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="pencil" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Playlist name"
                placeholderTextColor="#6b7280"
                autoFocus
                style={{ backgroundColor: '#27272a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#ffffff', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#3f3f46' }}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#27272a', alignItems: 'center' }}>
                  <Text style={{ color: '#a1a1aa', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreate} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center' }}>
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Rename modal */}
      <Modal visible={renameModalVisible} transparent animationType="fade" onRequestClose={() => setRenameModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', paddingHorizontal: 24 }}>
            <View style={{ backgroundColor: '#1c1c1e', borderRadius: 24, padding: 24, borderWidth: 0.5, borderColor: '#3a3a3c' }}>
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Rename Playlist</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Playlist name"
                placeholderTextColor="#6b7280"
                autoFocus
                style={{ backgroundColor: '#27272a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#ffffff', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#3f3f46' }}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setRenameModalVisible(false)} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#27272a', alignItems: 'center' }}>
                  <Text style={{ color: '#a1a1aa', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRename} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center' }}>
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}