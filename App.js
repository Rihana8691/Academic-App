import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { initDatabase } from './database';
import { isUserSetupComplete, initDefaultHabitTemplates } from './dbHelpers';
import { ThemeProvider, useTheme } from './ThemeContext';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddSemesterScreen from './screens/AddSemesterScreen';
import SemesterDetailScreen from './screens/SemesterDetailScreen';
import AddCourseScreen from './screens/AddCourseScreen';
import CourseDetailScreen from './screens/CourseDetailScreen';
import FinalGradesScreen from './screens/FinalGradesScreen';
import UserSetupScreen from './screens/UserSetupScreen';
import TasksScreen from './screens/TasksScreen';
import PersonalScreen from './screens/PersonalScreen';
import JournalScreen from './screens/JournalScreen';

const Stack = createNativeStackNavigator();

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
        console.error("Critical Boot Failure:", e);
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
          headerStyle: { backgroundColor: colors.background, borderBottomWidth: 2, borderBottomColor: colors.border },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Student', headerRight: () => null }} />
        <Stack.Screen name="AddSemester" component={AddSemesterScreen} options={{ title: 'New Term' }} />
        <Stack.Screen name="SemesterDetail" component={SemesterDetailScreen} options={{ title: 'Term Record' }} />
        <Stack.Screen name="AddCourse" component={AddCourseScreen} options={{ title: 'Enroll Course' }} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: 'Course Ledger' }} />
        <Stack.Screen name="FinalGrades" component={FinalGradesScreen} options={{ title: 'Grade Entry' }} />
        <Stack.Screen name="UserSetup" component={UserSetupScreen} options={{ title: 'Student File' }} />
        <Stack.Screen name="Tasks" component={TasksScreen} options={{ title: 'Assignments' }} />
        <Stack.Screen name="Personal" component={PersonalScreen} options={{ title: 'Daily Log' }} />
        <Stack.Screen name="Journal" component={JournalScreen} options={{ title: 'Journal' }} />
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
