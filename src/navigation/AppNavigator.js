import React from 'react';
// import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Login';
import Dashboard from '../screens/Dashboard';
import Today from '../screens/Today';
import Yesterday from '../screens/Yesterday';
import Monthly from '../screens/Monthly';
import Reservation from '../screens/Reservation';

import { NavigationContainer } from '@react-navigation/native';
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="Today" component={Today} />
      <Stack.Screen name="Yesterday" component={Yesterday} />
      <Stack.Screen name="Monthly" component={Monthly} />
      <Stack.Screen name="Reservation" component={Reservation} />


    </Stack.Navigator>
  );
}
