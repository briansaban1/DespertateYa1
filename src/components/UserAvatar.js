import React from 'react';
import { useSelector } from 'react-redux';
import { useDarkMode } from '../DarkModeContext';
import { Colors, Dimensions, DarkMode } from '../constants';
import { Text, View } from 'react-native';



function UserAvatar({ color, size, weight }) {
    //const profile = useSelector(store => store.user.profile)
    const { darkMode } = useDarkMode();


    return (
        <View darkMode={darkMode} style={{
            backgroundColor: color, height: 45,
            width: 45,
            borderRadius: 45,
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: darkMode ? DarkMode.blue50 : '#223E6D',
            borderWidth: 1.8
        }}>
            <Text style={{ fontSize: size, fontWeight: weight, color: darkMode ? DarkMode.blue50 : Colors.blue400 }}>
                {(("Brian").charAt(0).toUpperCase())}{(("Saban").charAt(0)).toUpperCase()}
                </Text>
        </View>
    )
}

export default UserAvatar