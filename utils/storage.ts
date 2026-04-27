import * as FileSystem from 'expo-file-system/legacy';
import Song from '../models/Song';

const SONGS_DIR = FileSystem.documentDirectory + 'songs/';
const METADATA_FILE = FileSystem.documentDirectory + 'songs.json';

async function ensureSongsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(SONGS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(SONGS_DIR, { intermediates: true });
  }
}

export async function loadSongsFromFile(): Promise<Song[]> {
  try {
    const info = await FileSystem.getInfoAsync(METADATA_FILE);
    if (!info.exists) return [];
    const json = await FileSystem.readAsStringAsync(METADATA_FILE);
    const parsed = JSON.parse(json);
    return parsed.map((s: any) => new Song(s.title, s.duration, s.uri));
  } catch {
    return [];
  }
}

export async function saveSongsToFile(songs: Song[]): Promise<void> {
  try {
    const plain = songs.map(s => ({
      title: s.title,
      duration: s.duration,
      uri: s.uri,
    }));
    await FileSystem.writeAsStringAsync(METADATA_FILE, JSON.stringify(plain));
  } catch (err) {
    console.error('Error saving songs:', err);
  }
}

export default async function addSong(song: Song): Promise<void> {
  const songs = await loadSongsFromFile();
  const exists = songs.some(s => s.uri === song.uri);
  if (!exists) {
    songs.push(song);
    await saveSongsToFile(songs);
  }
}

export async function removeSongByUri(uri: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
    const songs = await loadSongsFromFile();
    await saveSongsToFile(songs.filter(s => s.uri !== uri));
  } catch (err) {
    console.error('Error removing song:', err);
  }
}

export type SyncResult = {
  imported: Song[];
  skipped: string[];
  failed: string[];
};

export async function syncSongs(
  pickedAssets: Array<{ uri: string; name: string; mimeType?: string }>
): Promise<SyncResult> {
  await ensureSongsDir();
  const existing = await loadSongsFromFile();
  const existingUriSet = new Set(existing.map(s => s.uri));
  const result: SyncResult = { imported: [], skipped: [], failed: [] };

  for (const asset of pickedAssets) {
    try {
      const safeName = asset.name.replace(/[^a-zA-Z0-9._\-\s]/g, '_');
      const destUri = SONGS_DIR + safeName;

      if (existingUriSet.has(destUri)) {
        result.skipped.push(asset.name);
        continue;
      }

      await FileSystem.copyAsync({ from: asset.uri, to: destUri });

      const title = safeName.replace(/\.[^.]+$/, '').trim();
      const newSong = new Song(title, 0, destUri);
      result.imported.push(newSong);
      existingUriSet.add(destUri);
    } catch (err) {
      console.error('Failed to import:', asset.name, err);
      result.failed.push(asset.name);
    }
  }

  if (result.imported.length > 0) {
    await saveSongsToFile([...existing, ...result.imported]);
  }

  return result;
}

export async function scanAndRebuild(): Promise<Song[]> {
  await ensureSongsDir();
  const files = await FileSystem.readDirectoryAsync(SONGS_DIR);
  const mp3Files = files.filter(f => f.toLowerCase().endsWith('.mp3'));

  const existing = await loadSongsFromFile();
  const existingMap = new Map(existing.map(s => [s.uri, s]));

  const songs: Song[] = mp3Files.map(filename => {
    const uri = SONGS_DIR + filename;
    if (existingMap.has(uri)) return existingMap.get(uri)!;
    const title = filename.replace(/\.[^.]+$/, '').trim();
    return new Song(title, 0, uri);
  });

  await saveSongsToFile(songs);
  return songs;
}

export function getSongsDir(): string {
  return SONGS_DIR;
}