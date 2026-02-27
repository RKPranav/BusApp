import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import DriverDashboard from '../screens/DriverDashboard';
import ParentDashboard from '../screens/ParentDashboard';
import AdminDashboard from '../screens/AdminDashboard';
import AdminMapScreen from '../screens/AdminMapScreen';
import ManageDrivers from '../screens/ManageDrivers';
import ManageParents from '../screens/ManageParents';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
        <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AdminMapScreen" component={AdminMapScreen} />
        <Stack.Screen name="ManageDrivers" component={ManageDrivers} />
        <Stack.Screen name="ManageParents" component={ManageParents} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
