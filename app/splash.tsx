import { View, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function CustomSplash({ onFinish }: { onFinish: () => void }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    async function start() {
      await SplashScreen.hideAsync();

      // Animate in
      opacity.value = withTiming(1, { duration: 600 });
      scale.value = withTiming(1, { duration: 600 });

      // Wait then finish
      setTimeout(() => {
        onFinish();
      }, 1800);
    }

    start();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Image
          source={require("../assets/images/splash.png")}
          style={styles.image}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#18B852",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: width * 0.9, // 🔥 CONTROL SIZE HERE
    height: width * 0.9,
  },
});