
import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform, Text } from 'react-native';
import { Colors, Dimensions, DarkMode, Images } from '../constants';
import ImageButton from './ImageButton';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../DarkModeContext';


const getStyles = () => {
    const { darkMode } = useDarkMode();
  
  return StyleSheet.create({
    headerIcon: {
        width: 25,
        height: 25,
        resizeMode: 'contain'
    },
})}

function Header({ title, description }) {
    const { goBack, canGoBack } = useNavigation();
    const { darkMode } = useDarkMode();
    const styles = getStyles(); // Obtén los estilos



    return (
        <View style={{ paddingHorizontal: 30 }}>
            <SafeAreaView />
            <View style={{width:'100%', marginTop: Platform.OS == 'android' ? 47 : 8, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row'}}>
                <ImageButton
                    source={darkMode ? Images.BackWhite : Images.Back}
                    imageStyle={styles.headerIcon}
                    onPress={() => { if (canGoBack()) { goBack() } 
                }}
                />
            </View>
            <Text style={{color: darkMode ? DarkMode.lightbackground : Colors.darkblue, fontSize: Dimensions.px25, fontWeight: 'bold', marginVertical: 10 }}>{title}</Text>
            {Boolean(description) && <Text style={{color: darkMode ? DarkMode.white : Colors.darkblue, fontSize: Dimensions.px14 }}>{description}</Text>}
        </View>
    )
}

export default Header