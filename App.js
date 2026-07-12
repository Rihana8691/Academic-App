import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { initDatabase } from './database';
import { isUserSetupComplete } from './dbHelpers';

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

const Stack = createNativeStackNavigator();

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#4DB6AC',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#333333',
    notification: '#FF80AB',
  },
};

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    try {
      initDatabase();
      setNeedsLogin(!isUserSetupComplete());
    } catch (e) {
      console.error("Critical Database Initialization Failure:", e);
    } finally {
      setIsReady(true);
    }
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#4DB6AC" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={AppDarkTheme}>
      <Stack.Navigator
        initialRouteName={needsLogin ? 'Login' : 'Dashboard'}
        screenOptions={{
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Dashboard' }}
        />
        <Stack.Screen
          name="AddSemester"
          component={AddSemesterScreen}
          options={{ title: 'Add Semester' }}
        />
        <Stack.Screen
          name="SemesterDetail"
          component={SemesterDetailScreen}
          options={{ title: 'Semester' }}
        />
        <Stack.Screen
          name="AddCourse"
          component={AddCourseScreen}
          options={{ title: 'Add Course' }}
        />
        <Stack.Screen
          name="CourseDetail"
          component={CourseDetailScreen}
          options={{ title: 'Course' }}
        />
        <Stack.Screen
          name="FinalGrades"
          component={FinalGradesScreen}
          options={{ title: 'Final Grades' }}
        />
        <Stack.Screen
          name="UserSetup"
          component={UserSetupScreen}
          options={{ title: 'Previous Record' }}
        />
        <Stack.Screen
          name="Tasks"
          component={TasksScreen}
          options={{ title: 'Tasks' }}
        />
        <Stack.Screen
          name="Personal"
          component={PersonalScreen}
          options={{ title: 'My Day' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}