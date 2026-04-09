import { Stack } from "expo-router";

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="email" />
            <Stack.Screen name="login" />
            <Stack.Screen name="verify" />
            <Stack.Screen name="details" />
        </Stack>
    );
}
