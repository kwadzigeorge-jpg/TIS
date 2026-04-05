import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';

import HomeScreen from '../screens/HomeScreen';
import RouteScreen from '../screens/RouteScreen';
import POIDetailScreen from '../screens/POIDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import ArticlesScreen from '../screens/ArticlesScreen';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1a6b3c',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Map" component={HomeScreen} options={{ tabBarLabel: 'Explore' }} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} options={{ tabBarLabel: 'Saved' }} />
      <Tab.Screen name="Articles" component={ArticlesScreen} options={{ tabBarLabel: 'Guides' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const token = useAuthStore((s) => s.token);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Route" component={RouteScreen} options={{ headerShown: true, title: 'Plan Route' }} />
          <Stack.Screen name="POIDetail" component={POIDetailScreen} options={{ headerShown: true, title: '' }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
