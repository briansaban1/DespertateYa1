import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import SplashScreen from 'react-native-splash-screen'
import { DarkModeProvider } from './DarkModeContext';
import { NavigationContainer, DefaultTheme, useNavigation } from '@react-navigation/native';


function MainApp( ) { // Cambié 'navigatorRef' a 'navigationRef'
    useEffect(() => {
        SplashScreen.hide()
    }, [])

    return (
        <SafeAreaProvider>
             <DarkModeProvider>
               <AppNavigator/>
             </DarkModeProvider>
        </SafeAreaProvider>
    );
}
export default MainApp;