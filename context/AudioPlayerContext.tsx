import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAudioPlayer as useExpoAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import Song from '../models/Song';
import { loadSongsFromFile } from '../utils/storage';

type AudioPlayerContextType = {
  isPlaying: boolean;
  currentSong: Song | null;
  playSong: (song: Song) => Promise<void>;
  pause: () => void;
  resume: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
};

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  isPlaying: false,
  currentSong: null,
  playSong: async () => {},
  pause: () => {},
  resume: () => {},
  playNext: async () => {},
  playPrevious: async () => {},
});

export const AudioPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const currentIndex = useRef<number>(-1);

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
    setPlaylist(songs);
  };

  const playSong = async (song: Song) => {
    if (playlist.length === 0) {
      await loadPlaylist();
    }

    const index = playlist.findIndex((s) => s.uri === song.uri);
    currentIndex.current = index === -1 ? 0 : index;

    player.replace({ uri: song.uri });
    player.play();
    setCurrentSong(song);
  };

  const pause = () => {
    player.pause();
  };

  const resume = () => {
    player.play();
  };

  const playNext = async () => {
    if (playlist.length === 0) {
      await loadPlaylist();
      return;
    }
    currentIndex.current = currentIndex.current === -1
      ? 0
      : (currentIndex.current + 1) % playlist.length;
    await playSong(playlist[currentIndex.current]);
  };

  const playPrevious = async () => {
    if (playlist.length === 0) {
      await loadPlaylist();
      return;
    }
    currentIndex.current = currentIndex.current === -1
      ? 0
      : (currentIndex.current - 1 + playlist.length) % playlist.length;
    await playSong(playlist[currentIndex.current]);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        isPlaying: status.playing,
        currentSong,
        playSong,
        pause,
        resume,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => useContext(AudioPlayerContext);