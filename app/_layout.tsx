import { Stack } from 'expo-router';
import './globals.css';
import { useFonts } from 'expo-font';
import { AudioPlayerProvider, useAudioPlayer } from '../context/AudioPlayerContext';
import MusicPlayer from '../components/MusicPlayer';
import { View } from 'react-native';

const TAB_BAR_HEIGHT = 80;

export default function RootLayout() {
  return (
    <AudioPlayerProvider>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <AudioPlayerWrapper />
      </View>
    </AudioPlayerProvider>
  );
}

function AudioPlayerWrapper() {
  const { currentSong } = useAudioPlayer();
  if (!currentSong) return null;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: TAB_BAR_HEIGHT - 3,
      }}
    >
      <MusicPlayer song={currentSong} />
    </View>
  );
}