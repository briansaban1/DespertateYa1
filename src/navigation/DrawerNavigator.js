import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import TabNavigator from './TabNavigator';
import Dimension from '../constants/dimensions';
import HomeScreen from '../screens/home';
import HomeScreen1 from '../screens/home/index2';
import DrawerContent from '../screens/side-menu'
import BrujulaScreen from '../screens/brujula';
import AlarmaScreen from '../screens/home/alarma';


const Drawer = createDrawerNavigator();

function MainApp() {

    return (
        <Drawer.Navigator
            initialRouteName="TabNavigator"
            drawerStyle={{width:Dimension.deviceWidth-100}}
            drawerContent={props => <DrawerContent {...props} />}
        >
            <Drawer.Screen options={{headerShown: false}} name="TabNavigator" component={TabNavigator} />
            <Drawer.Screen name="Home" options={{unmountOnBlur: true, headerShown: false}} component={HomeScreen} />
            <Drawer.Screen name="Home1" options={{unmountOnBlur: true, headerShown: false}} component={HomeScreen1} />
            <Drawer.Screen name="Brujula"  options={{unmountOnBlur: true, headerShown: false}} component={BrujulaScreen} />
            <Drawer.Screen name="Alarma"  options={{unmountOnBlur: true, headerShown: false}} component={AlarmaScreen} />

        </Drawer.Navigator>
    );
}

export default MainApp;
