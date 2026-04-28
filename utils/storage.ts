import * as FileSystem from 'expo-file-system/legacy';
import Song from '../models/Song';
import Playlist from '../models/Playlist';

const SONGS_DIR = FileSystem.documentDirectory + 'songs/';
const ARTWORK_DIR = FileSystem.documentDirectory + 'artwork/';
const METADATA_FILE = FileSystem.documentDirectory + 'songs.json';
const PLAYLISTS_FILE = FileSystem.documentDirectory + 'playlists.json';

async function ensureDir(dir: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
}

export async function saveArtwork(imageUri: string, id: string): Promise<string> {
  await ensureDir(ARTWORK_DIR);
  const ext = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
  const destUri = ARTWORK_DIR + id + '.' + ext;
  await FileSystem.copyAsync({ from: imageUri, to: destUri });
  return destUri;
}

export async function deleteArtwork(artworkUri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(artworkUri);
    if (info.exists) await FileSystem.deleteAsync(artworkUri, { idempotent: true });
  } catch {}
}


export async function loadSongsFromFile(): Promise<Song[]> {
  try {
    const info = await FileSystem.getInfoAsync(METADATA_FILE);
    if (!info.exists) return [];
    const json = await FileSystem.readAsStringAsync(METADATA_FILE);
    const parsed = JSON.parse(json);
    return parsed.map((s: any) => new Song(s.title, s.duration, s.uri));
  } catch { return []; }
}

export async function saveSongsToFile(songs: Song[]): Promise<void> {
  try {
    const plain = songs.map(s => ({ title: s.title, duration: s.duration, uri: s.uri }));
    await FileSystem.writeAsStringAsync(METADATA_FILE, JSON.stringify(plain));
  } catch (err) { console.error('Error saving songs:', err); }
}

export default async function addSong(song: Song): Promise<void> {
  const songs = await loadSongsFromFile();
  if (!songs.some(s => s.uri === song.uri)) {
    songs.push(song);
    await saveSongsToFile(songs);
  }
}

export async function removeSongByUri(uri: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
    const songs = await loadSongsFromFile();
    await saveSongsToFile(songs.filter(s => s.uri !== uri));
    const playlists = await loadPlaylists();
    await savePlaylists(playlists.map(p =>
      new Playlist(p.name, p.songUris.filter(u => u !== uri), p.id, p.createdAt, p.artwork)
    ));
  } catch (err) { console.error('Error removing song:', err); }
}

export type SyncResult = { imported: Song[]; skipped: string[]; failed: string[] };

export async function syncSongs(
  pickedAssets: Array<{ uri: string; name: string; mimeType?: string }>
): Promise<SyncResult> {
  await ensureDir(SONGS_DIR);
  const existing = await loadSongsFromFile();
  const existingUriSet = new Set(existing.map(s => s.uri));
  const result: SyncResult = { imported: [], skipped: [], failed: [] };
  for (const asset of pickedAssets) {
    try {
      const safeName = asset.name.replace(/[^a-zA-Z0-9._\-\s]/g, '_');
      const destUri = SONGS_DIR + safeName;
      if (existingUriSet.has(destUri)) { result.skipped.push(asset.name); continue; }
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });
      result.imported.push(new Song(safeName.replace(/\.[^.]+$/, '').trim(), 0, destUri));
      existingUriSet.add(destUri);
    } catch (err) { result.failed.push(asset.name); }
  }
  if (result.imported.length > 0) await saveSongsToFile([...existing, ...result.imported]);
  return result;
}

export async function scanAndRebuild(): Promise<Song[]> {
  await ensureDir(SONGS_DIR);
  const files = await FileSystem.readDirectoryAsync(SONGS_DIR);
  const existing = await loadSongsFromFile();
  const existingMap = new Map(existing.map(s => [s.uri, s]));
  const songs: Song[] = files
    .filter(f => f.toLowerCase().endsWith('.mp3'))
    .map(filename => {
      const uri = SONGS_DIR + filename;
      return existingMap.get(uri) ?? new Song(filename.replace(/\.[^.]+$/, '').trim(), 0, uri);
    });
  await saveSongsToFile(songs);
  return songs;
}

export function getSongsDir(): string { return SONGS_DIR; }


export async function loadPlaylists(): Promise<Playlist[]> {
  try {
    const info = await FileSystem.getInfoAsync(PLAYLISTS_FILE);
    if (!info.exists) return [];
    const json = await FileSystem.readAsStringAsync(PLAYLISTS_FILE);
    const parsed = JSON.parse(json);
    return parsed.map((p: any) => new Playlist(p.name, p.songUris, p.id, p.createdAt, p.artwork));
  } catch { return []; }
}

export async function savePlaylists(playlists: Playlist[]): Promise<void> {
  try {
    const plain = playlists.map(p => ({
      id: p.id, name: p.name, songUris: p.songUris, createdAt: p.createdAt, artwork: p.artwork,
    }));
    await FileSystem.writeAsStringAsync(PLAYLISTS_FILE, JSON.stringify(plain));
  } catch (err) { console.error('Error saving playlists:', err); }
}

export async function createPlaylist(name: string, artwork?: string): Promise<Playlist> {
  const playlists = await loadPlaylists();
  const newPlaylist = new Playlist(name.trim(), [], undefined, undefined, artwork);
  await savePlaylists([...playlists, newPlaylist]);
  return newPlaylist;
}

export async function deletePlaylist(id: string): Promise<void> {
  const playlists = await loadPlaylists();
  const playlist = playlists.find(p => p.id === id);
  if (playlist?.artwork) await deleteArtwork(playlist.artwork);
  await savePlaylists(playlists.filter(p => p.id !== id));
}

export async function renamePlaylist(id: string, newName: string): Promise<void> {
  const playlists = await loadPlaylists();
  await savePlaylists(playlists.map(p =>
    p.id === id ? new Playlist(newName.trim(), p.songUris, p.id, p.createdAt, p.artwork) : p
  ));
}

export async function updatePlaylistArtwork(id: string, artworkUri: string | undefined): Promise<void> {
  const playlists = await loadPlaylists();
  await savePlaylists(playlists.map(p =>
    p.id === id ? new Playlist(p.name, p.songUris, p.id, p.createdAt, artworkUri) : p
  ));
}

export async function addSongToPlaylist(playlistId: string, songUri: string): Promise<void> {
  const playlists = await loadPlaylists();
  await savePlaylists(playlists.map(p => {
    if (p.id !== playlistId || p.songUris.includes(songUri)) return p;
    return new Playlist(p.name, [...p.songUris, songUri], p.id, p.createdAt, p.artwork);
  }));
}

export async function removeSongFromPlaylist(playlistId: string, songUri: string): Promise<void> {
  const playlists = await loadPlaylists();
  await savePlaylists(playlists.map(p => {
    if (p.id !== playlistId) return p;
    return new Playlist(p.name, p.songUris.filter(u => u !== songUri), p.id, p.createdAt, p.artwork);
  }));
}