
import * as FileSystem from 'expo-file-system/legacy';
import Song from '../models/Song';
 
const fileUri = FileSystem.documentDirectory + 'songs.json';
 
export default async function addSong(song: Song) {
  console.log("addSong:", song);
  const songs = await loadSongsFromFile();
  songs.push(song);
  await saveSongsToFile(songs);
}
 
export async function saveSongsToFile(songs: Song[]) {
  try {
    const plainSongs = songs.map(s => ({
      title: s.title,
      artist: s.artist,
      duration: s.duration,
      uri: s.uri,
    }));
    const json = JSON.stringify(plainSongs);
    console.log("Zapisuję JSON:", json);
    await FileSystem.writeAsStringAsync(fileUri, json);
    console.log("Plik zapisany:", fileUri);
  } catch (err) {
    console.error('Błąd przy zapisie:', err);
  }
}
 
export async function loadSongsFromFile(): Promise<Song[]> {
  try {
    const exists = await FileSystem.getInfoAsync(fileUri);
    if (!exists.exists) {
      return [];
    }
    const json = await FileSystem.readAsStringAsync(fileUri);
    const parsed = JSON.parse(json);
    const songs = parsed.map(
      (s: any) => new Song(s.title, s.artist, s.duration, s.uri)
    );
    console.log("Załadowane obiekty Song:", songs);
    return songs;
  } catch (err) {
    console.error('Błąd przy wczytywaniu songs.json:', err);
    return [];
  }
}
 
export async function removeSongByUri(uriToRemove: string) {
  try {
    const songs = await loadSongsFromFile();
    const filteredSongs = songs.filter(song => song.uri !== uriToRemove);
    if (filteredSongs.length === songs.length) {
      console.log(`⚠️ Nie znaleziono piosenki do usunięcia o uri: ${uriToRemove}`);
      return;
    }
    await saveSongsToFile(filteredSongs);
    console.log(`Usunięto piosenkę o uri: ${uriToRemove}`);
  } catch (err) {
    console.error('Błąd przy usuwaniu piosenki:', err);
  }
}
 
export async function createTestSongs() {
  const testSongs = [
    new Song("Bohemian Rhapsody", "Queen", 354000, ""),
    new Song("Stairway to Heaven", "Led Zeppelin", 482000, ""),
    new Song("Hotel California", "Eagles", 391000, ""),
  ];
  await saveSongsToFile(testSongs);
  console.log("Test songs created.");
}
