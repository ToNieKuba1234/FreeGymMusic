import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { StyleSheet } from "react-native";

export default function TabLayout() {
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
                backgroundColor: 'rgba(15, 15, 15, 0.85)',
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
                    intensity={90}
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
                    tabBarIcon: ({focused, color}) => <MaterialCommunityIcons name="playlist-play" color={color} size={30} />
                }}
            />
            <Tabs.Screen
                name="Songs"
                options={{
                    headerShown: false,
                    tabBarIcon: ({focused, color}) => <Ionicons name={focused ? "musical-notes" : "musical-notes-outline"} color={color} size={24} />
                }}
            /> 
        </Tabs>
  )
}