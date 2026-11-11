import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <StatusBar style="light" />
      <Text className="text-3xl font-bold text-foreground">
        Fullstack Boilerplate
      </Text>
      <Text className="mt-2 text-center text-base text-muted">
        Expo SDK 58 + React Native + NativeWind
      </Text>
    </View>
  );
}
