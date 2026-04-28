import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAudioPlayer as useExpoAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import Song from '../models/Song';

type AudioPlayerContextType = {
  isPlaying: boolean;
  isShuffled: boolean;
  currentSong: Song | null;
  playSong: (song: Song) => Promise<void>;
  playList: (songs: Song[], shuffle: boolean, startIndex?: number) => Promise<void>;
  pause: () => void;
  resume: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
};

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  isPlaying: false,
  isShuffled: false,
  currentSong: null,
  playSong: async () => {},
  playList: async () => {},
  pause: () => {},
  resume: () => {},
  playNext: async () => {},
  playPrevious: async () => {},
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

  const queueRef = useRef<Song[]>([]);
  const fullPlaylistRef = useRef<Song[]>([]); 
  
  const player = useExpoAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    (async () => {
      await setAudioModeAsync({
        shouldPlayInBackground: true,
        playsInSilentMode: true,
      });
    })();
  }, []);

  useEffect(() => {
    if (status.didJustFinish) {
      playNext();
    }
  }, [status.didJustFinish]);

  const playList = async (songs: Song[], shuffle: boolean, startIndex?: number) => {
    if (songs.length === 0) return;
    
    fullPlaylistRef.current = songs; 
    setIsShuffled(shuffle);

    const actualStartIndex = startIndex !== undefined 
      ? startIndex 
      : (shuffle ? Math.floor(Math.random() * songs.length) : 0);
    
    let songsToQueue: Song[];

    if (shuffle) {
      const startSong = songs[actualStartIndex];
      const rest = songs.filter((_, index) => index !== actualStartIndex);
      songsToQueue = [startSong, ...shuffleArray(rest)];
    } else {
      songsToQueue = [...songs.slice(actualStartIndex), ...songs.slice(0, actualStartIndex)];
    }
    
    queueRef.current = songsToQueue.slice(1);
    await playSong(songsToQueue[0]);
  };

  const playSong = async (song: Song) => {
    player.replace({ uri: song.uri });
    player.play();
    setCurrentSong(song);
  };

  const pause = () => player.pause();
  const resume = () => player.play();

  const playNext = async () => {
    if (queueRef.current.length > 0) {
      const nextSong = queueRef.current[0];
      queueRef.current = queueRef.current.slice(1);
      await playSong(nextSong);
    } 
    else if (fullPlaylistRef.current.length > 0) {
      if (isShuffled) {
        const reshuffled = shuffleArray(fullPlaylistRef.current);
        queueRef.current = reshuffled.slice(1);
        await playSong(reshuffled[0]);
      } else {
        queueRef.current = fullPlaylistRef.current.slice(1);
        await playSong(fullPlaylistRef.current[0]);
      }
    }
    else {
      player.pause();
      setCurrentSong(null);
    }
  };

  const playPrevious = async () => {
    console.log("Previous not implemented for queue yet");
  };

  return (
    <AudioPlayerContext.Provider value={{
      isPlaying: status.playing,
      isShuffled,
      currentSong,
      playSong,
      playList,
      pause,
      resume,
      playNext,
      playPrevious,
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => useContext(AudioPlayerContext);