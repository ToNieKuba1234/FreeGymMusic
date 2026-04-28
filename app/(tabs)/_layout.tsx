import { Tabs, usePathname } from "expo-router"; // Dodaj usePathname
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";

export default function TabLayout() {
    const pathname = usePathname(); // Pobieramy aktualną ścieżkę
    
    // Sprawdzamy, czy jesteśmy na podstronie playlisty
    const isPlaylistActive = pathname.includes('/playlist/');

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    height: 90,
                    paddingBottom: 12,
                    paddingTop: 8,
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    borderTopWidth: 0,
                    backgroundColor: 'transparent',
                    overflow: 'hidden',
                },
                tabBarActiveTintColor: '#8E1616',
                tabBarInactiveTintColor: 'gray',
                tabBarLabelStyle: {
                    fontFamily: 'SFProBold',
                    fontSize: 10,
                },
                tabBarBackground: () => (
                    <BlurView
                        intensity={60}
                        tint="dark"
                        style={{
                            ...StyleSheet.absoluteFillObject,
                            borderTopLeftRadius: 25,
                            borderTopRightRadius: 25,
                            overflow: 'hidden',
                        }}
                    />
                ),
            }}
        >
            <Tabs.Screen
                name="Playlists"
                options={{
                    headerShown: false,
                    // Wymuszamy kolor aktywny, jeśli jesteśmy wewnątrz playlisty
                    tabBarActiveTintColor: isPlaylistActive ? '#8E1616' : undefined,
                    tabBarIcon: ({ focused, color }) => (
                        <MaterialCommunityIcons 
                            name="playlist-play" 
                            // Jeśli "focused" (zwykła zakładka) LUB "isPlaylistActive" (hack), używamy koloru aktywnego
                            color={(focused || isPlaylistActive) ? '#8E1616' : color} 
                            size={30} 
                        />
                    ),
                    tabBarLabel: ({ focused, color }) => (
                         // Robimy to samo z etykietą, żeby też się podświetlała
                        <Text style={{ 
                            fontSize: 10, 
                            color: (focused || isPlaylistActive) ? '#8E1616' : color,
                            fontFamily: 'SFProBold' 
                        }}>
                            Playlists
                        </Text>
                    )
                }}
            />
            <Tabs.Screen
                name="Songs"
                options={{
                    headerShown: false,
                    tabBarIcon: ({focused, color}) => <Ionicons name={focused ? "musical-notes" : "musical-notes-outline"} color={color} size={24} />
                }}
            />
            <Tabs.Screen
                name="playlist/[id]"
                options={{
                    href: null,
                    headerShown: false,
                }}
            />
        </Tabs>
    );
}

// Pamiętaj o zaimportowaniu Text z react-native do tabBarLabel
import { Text } from 'react-native';