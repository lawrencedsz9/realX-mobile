import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { withLayoutContext } from 'expo-router';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

const NativeTabsNavigator = createNativeBottomTabNavigator().Navigator;
const JSTabsNavigator = createBottomTabNavigator().Navigator;

const NativeTabs = withLayoutContext(NativeTabsNavigator);
const JSTabs = withLayoutContext(JSTabsNavigator);

export default function TabLayout() {
    const { t, i18n } = useTranslation();
    const Tabs = Platform.OS === 'ios' ? NativeTabs : JSTabs;
    
    // In RTL (Arabic), React Native mirrors the layout (Right-to-Left).
    // To ensure "Home, Wallet, Profile" is displayed Left-to-Right in Arabic,
    // we reverse the array of screens so they render [Profile, Wallet, Home] Right-to-Left,
    // effectively appearing Left-to-Right as Home, Wallet, Profile.
    const isArabic = i18n.language === 'ar';

    const screens = [
        <Tabs.Screen
            key="index"
            name="index"
            options={{
                title: t('home'),
                headerShown: false,
                tabBarIcon: (props: any) =>
                    Platform.OS === 'ios'
                        ? ({ sfSymbol: 'house' } as any)
                        : <Ionicons name={props.focused ? 'home' : 'home-outline'} size={24} color={props.color} />,
            }}
        />,
        <Tabs.Screen
            key="wallet"
            name="wallet"
            options={{
                title: t('wallet'),
                headerShown: false,
                tabBarIcon: (props: any) =>
                    Platform.OS === 'ios'
                        ? ({ sfSymbol: 'creditcard.fill' } as any)
                        : <Ionicons name={props.focused ? 'card' : 'card-outline'} size={24} color={props.color} />,
            }}
        />,
        <Tabs.Screen
            key="profile"
            name="profile"
            options={{
                title: t('profile'),
                headerShown: false,
                tabBarIcon: (props: any) =>
                    Platform.OS === 'ios'
                        ? ({ sfSymbol: 'person.fill' } as any)
                        : <Ionicons name={props.focused ? 'person' : 'person-outline'} size={24} color={props.color} />,
            }}
        />,
    ];

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#18B852',
                tabBarInactiveTintColor: '#8E8E93',
            }}
        >
            {isArabic ? [...screens].reverse() : screens}
        </Tabs>
    );
}
