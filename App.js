import { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, useIsFocused } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { initDatabase } from './database';
import { isUserSetupComplete, initDefaultHabitTemplates, getPendingTasks } from './dbHelpers';
import { ThemeProvider, useTheme } from './ThemeContext';
import { onTasksChanged } from './events';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import TermsScreen from './screens/TermsScreen';
import TasksScreen from './screens/TasksScreen';
import MeScreen from './screens/MeScreen';
import AddSemesterScreen from './screens/AddSemesterScreen';
import SemesterDetailScreen from './screens/SemesterDetailScreen';
import AddCourseScreen from './screens/AddCourseScreen';
import CourseDetailScreen from './screens/CourseDetailScreen';
import FinalGradesScreen from './screens/FinalGradesScreen';
import UserSetupScreen from './screens/UserSetupScreen';
import PersonalScreen from './screens/PersonalScreen';
import JournalScreen from './screens/JournalScreen';
import ChapterNotesScreen from './screens/ChapterNotesScreen';
import ChapterImagesScreen from './screens/ChapterImagesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Terms: ['map', 'map-outline'],
  Tasks: ['checkbox', 'checkbox-outline'],
  Me: ['person', 'person-outline'],
};

// The four main tabs. The stack route is still called "Dashboard" so Login keeps working.
function TabsNavigator() {
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [pending, setPending] = useState(0);

  const refresh = useCallback(() => {
    try { setPending(getPendingTasks().length); } catch (e) { /* db not ready */ }
  }, []);

  useEffect(() => { if (isFocused) refresh(); }, [isFocused, refresh]);
  useEffect(() => onTasksChanged(refresh), [refresh]);

  return (
    <Tab.Navigator
      screenListeners={{ state: refresh }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subText,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 0.5, height: 58 + insets.bottom, paddingBottom: insets.bottom + 6, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarBadgeStyle: { backgroundColor: colors.error, color: '#fff', fontSize: 10 },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={TAB_ICONS[route.name][focused ? 0 : 1]} size={22} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Terms" component={TermsScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarBadge: pending > 0 ? pending : undefined }} />
      <Tab.Screen name="Me" component={MeScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { theme, colors } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    const bootstrap = () => {
      try {
        initDatabase();
        initDefaultHabitTemplates();
        setNeedsLogin(!isUserSetupComplete());
      } catch (e) {
        console.error('Critical Boot Failure:', e);
      } finally {
        setIsReady(true);
      }
    };
    bootstrap();
  }, []);

  if (!isReady) {
    const splashBg = theme === 'dark' ? '#121212' : '#F4F1EA';
    const loaderColor = theme === 'dark' ? '#4DB6AC' : '#1B263B';
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: splashBg }}>
        <ActivityIndicator size="large" color={loaderColor} />
      </View>
    );
  }

  const baseTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  // Robust font fallback for React Navigation 7
  const defaultFonts = {
    regular: { fontFamily: 'sans-serif', fontWeight: 'normal' },
    medium: { fontFamily: 'sans-serif-medium', fontWeight: 'normal' },
    bold: { fontFamily: 'sans-serif', fontWeight: 'bold' },
    heavy: { fontFamily: 'sans-serif', fontWeight: '900' },
  };

  const navTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.error,
    },
    fonts: baseTheme.fonts || defaultFonts,
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={needsLogin ? 'Login' : 'Dashboard'}
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="AddSemester" component={AddSemesterScreen} options={{ title: 'New Term' }} />
        <Stack.Screen name="SemesterDetail" component={SemesterDetailScreen} options={{ title: 'Term' }} />
        <Stack.Screen name="AddCourse" component={AddCourseScreen} options={{ title: 'Add Course' }} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: 'Course' }} />
        <Stack.Screen name="FinalGrades" component={FinalGradesScreen} options={{ title: 'Grades' }} />
        <Stack.Screen name="UserSetup" component={UserSetupScreen} options={{ title: 'Student File' }} />
        <Stack.Screen name="Personal" component={PersonalScreen} options={{ title: 'Daily Log' }} />
        <Stack.Screen name="Journal" component={JournalScreen} options={{ title: 'Journal' }} />
        <Stack.Screen name="ChapterNotes" component={ChapterNotesScreen} options={{ title: 'Chapter Notes' }} />
        <Stack.Screen name="ChapterImages" component={ChapterImagesScreen} options={{ title: 'Chapter Images' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
