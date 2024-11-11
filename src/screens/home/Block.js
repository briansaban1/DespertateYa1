import React from 'react';
import { Button, Text, View } from 'react-native';
import getStyles from './styles';
import { Dimensions, Colors, DarkMode } from '../../constants';
import { useDarkMode } from '../../DarkModeContext';


function Block({ label, label1, value }) {
    const { darkMode } = useDarkMode();
    const styles = getStyles();
    return (
        <View style={{alignSelf: 'flex-start'}}>
            <Text style={{
                fontSize: Dimensions.px15,
                marginBottom: 5,
                maxWidth:125,
                color: darkMode ? DarkMode.white : Colors.blue400,
            }}>{label}</Text>
            
            <Text
                style={{
                    fontSize: Dimensions.px16,
                    color: darkMode ? DarkMode.white : Colors.darkblue,
                    fontWeight: 'bold'
                }}
            >{value}</Text>
        </View>
    );
}

export default Block;
