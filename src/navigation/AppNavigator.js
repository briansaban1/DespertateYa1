import { NavigationContainer, DefaultTheme, useNavigation } from '@react-navigation/native';
import { useLinking } from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import React, {useEffect, useState} from 'react';
import { navigationRef } from './RootNavigation';
import HomeScreen1 from '../screens/home/index2';
import MainApp from './DrawerNavigator';
import { useDarkMode } from '../DarkModeContext';
import { Colors, DarkMode } from '../constants';
import {linking} from './linkingConfig';
import AlarmaScreen from '../screens/home/alarma'
import { Linking } from 'react-native';
import Screens from '../constants/screens';
import RootNavigation from './RootNavigation';


const AppStack = createStackNavigator();


const options = { headerShown: false };

function AppNavigator() {
  const { darkMode } = useDarkMode();
  

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: darkMode ? DarkMode.lightbackground : Colors.lightbackground,
    },
  };

  return (
    <NavigationContainer  ref={(ref) => RootNavigation.setTopLevelNavigator(ref)} theme={theme}>
      <AppStack.Navigator
        screenOptions={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
        initialRouteName="Alarma">
        <AppStack.Screen name="HomeScreen1" component={HomeScreen1} options={options} />
        <AppStack.Screen name="MainApp" component={MainApp} options={options} />
        <AppStack.Screen name="Alarma" component={AlarmaScreen} options={options} />

      </AppStack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
