import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAudioPlayer as useExpoAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import Song from '../models/Song';
import { loadSongsFromFile } from '../utils/storage';

type AudioPlayerContextType = {
  isPlaying: boolean;
  isShuffled: boolean;
  currentSong: Song | null;
  playSong: (song: Song) => Promise<void>;
  pause: () => void;
  resume: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  toggleShuffle: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  isPlaying: false,
  isShuffled: false,
  currentSong: null,
  playSong: async () => {},
  pause: () => {},
  resume: () => {},
  playNext: async () => {},
  playPrevious: async () => {},
  toggleShuffle: () => {},
});

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const AudioPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isShuffled, setIsShuffled] = useState(false);

  const originalPlaylistRef = useRef<Song[]>([]);
  const playlistRef = useRef<Song[]>([]);
  const currentIndex = useRef<number>(-1);
  const isShuffledRef = useRef(false);

  const player = useExpoAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    (async () => {
      await setAudioModeAsync({
        shouldPlayInBackground: true,
        playsInSilentMode: true,
      });
      await loadPlaylist();
    })();
  }, []);

  useEffect(() => {
    if (status.didJustFinish) {
      playNext();
    }
  }, [status.didJustFinish]);

  const loadPlaylist = async () => {
    const songs = await loadSongsFromFile();
    originalPlaylistRef.current = songs;
    playlistRef.current = isShuffledRef.current ? shuffleArray(songs) : songs;
  };

  const playSong = async (song: Song) => {
    if (playlistRef.current.length === 0) await loadPlaylist();
    const index = playlistRef.current.findIndex(s => s.uri === song.uri);
    currentIndex.current = index === -1 ? 0 : index;
    player.replace({ uri: song.uri });
    player.play();
    setCurrentSong(song);
  };

  const pause = () => player.pause();
  const resume = () => player.play();

  const playNext = async () => {
    if (playlistRef.current.length === 0) { await loadPlaylist(); return; }
    currentIndex.current = currentIndex.current === -1
      ? 0
      : (currentIndex.current + 1) % playlistRef.current.length;
    await playSong(playlistRef.current[currentIndex.current]);
  };

  const playPrevious = async () => {
    if (playlistRef.current.length === 0) { await loadPlaylist(); return; }
    currentIndex.current = currentIndex.current === -1
      ? 0
      : (currentIndex.current - 1 + playlistRef.current.length) % playlistRef.current.length;
    await playSong(playlistRef.current[currentIndex.current]);
  };

  const toggleShuffle = () => {
    const newShuffled = !isShuffledRef.current;
    isShuffledRef.current = newShuffled;
    setIsShuffled(newShuffled);

    if (newShuffled) {
      // Shuffle — put current song first so playback continues smoothly
      const current = currentSong;
      const rest = originalPlaylistRef.current.filter(s => s.uri !== current?.uri);
      const shuffled = current ? [current, ...shuffleArray(rest)] : shuffleArray(rest);
      playlistRef.current = shuffled;
      currentIndex.current = 0;
    } else {
      // Unshuffle — restore original order, find current song
      playlistRef.current = originalPlaylistRef.current;
      currentIndex.current = currentSong
        ? originalPlaylistRef.current.findIndex(s => s.uri === currentSong.uri)
        : -1;
    }
  };

  return (
    <AudioPlayerContext.Provider value={{
      isPlaying: status.playing,
      isShuffled,
      currentSong,
      playSong,
      pause,
      resume,
      playNext,
      playPrevious,
      toggleShuffle,
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => useContext(AudioPlayerContext);