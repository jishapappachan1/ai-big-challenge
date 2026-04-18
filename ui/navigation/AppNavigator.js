import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LandingScreen from '../screens/LandingScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EmailVerifyScreen from '../screens/EmailVerifyScreen';
import QuizScreen from '../screens/QuizScreen';
import CreativeScreen from '../screens/CreativeScreen';
import EntryAcceptedScreen from '../screens/EntryAcceptedScreen';
import ShortlistResultScreen from '../screens/ShortlistResultScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ResultScreen from '../screens/ResultScreen';
import QuizIncorrectScreen from '../screens/QuizIncorrectScreen';
import QuizTimeoutScreen from '../screens/QuizTimeoutScreen';

const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#08002E',
  },
};

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const resolveInitialRoute = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setInitialRoute(token ? 'Dashboard' : 'Landing');
      } catch (e) {
        setInitialRoute('Landing');
      }
    };
    resolveInitialRoute();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#08002E', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#08002E' }
        }}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="EmailVerify" component={EmailVerifyScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Creative" component={CreativeScreen} />
        <Stack.Screen name="ShortlistResult" component={ShortlistResultScreen} />
        <Stack.Screen name="EntryAccepted" component={EntryAcceptedScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="QuizIncorrect" component={QuizIncorrectScreen} />
        <Stack.Screen name="QuizTimeout" component={QuizTimeoutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
