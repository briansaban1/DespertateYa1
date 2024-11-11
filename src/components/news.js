import React, { useState } from 'react';
import { Image, StyleSheet, View, LayoutAnimation, StatusBar, TouchableOpacity, Text } from 'react-native';
import { Colors, Dimensions, DarkMode } from '../constants';
import ImageButton from './ImageButton';
import moment from 'moment';
import 'moment/locale/es';
import { useDarkMode } from '../DarkModeContext';
import { color } from 'react-native-reanimated';


function SubmissionItem({ data, profile, onPress }) {
    const [display, setDisplay] = useState(false)
    const styles = getStyles(); // Obtén los estilos
    const { darkMode } = useDarkMode();


    return (

        <View style={styles.container}>
            <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center' }}>
                <Image
                    source={darkMode ? require('../assets/profile.png') : require('../assets/profile.png')}
                    style={{ width: 35, height: 35, resizeMode: 'contain' }}
                />
                <View style={{ marginLeft: 10 }}>
                    <Text style={{ color: darkMode ? DarkMode.blue100 : Colors.blue400 }}>Brian</Text>
                    <Text style={{ color: darkMode ? DarkMode.blue100 : Colors.blue400 }}>Fecha de Publicación</Text>
                </View>
            </View>

            <View style={{ padding: 10 }}>
                <Text style={{ color: darkMode ? DarkMode.blue100 : Colors.blue400 }}>
                    Hola! Esto es una prueba
                    </Text>

            </View>

            <View style={styles.mainContainer} >
                <Image
                    source={{ uri: 'https://i.workana.com/wp-content/uploads/2019/02/ab-testing-split-min.jpg' }}
                    style={{ width: Dimensions.deviceWidth - 50, height: 165, resizeMode: 'contain', borderRadius: 10, }}
                />
            </View>
            <View style={{ padding: 5, flexDirection: 'row', marginLeft: 10 }}>
                <ImageButton
                    source={darkMode ? require('../assets/me-gusta.png') : require('../assets/me-gusta.png')}
                    imageStyle={styles.icon}
                    style={{ position: 'contain', bottom: 0, }}
                    onPress={() => { onPress && onPress(data) }}
                />
                <ImageButton
                    source={darkMode ? require('../assets/enviar.png') : require('../assets/enviar.png')}
                    imageStyle={styles.icon}
                    style={{ position: 'contain', bottom: 0, marginLeft: 5 }}
                    onPress={() => { onPress && onPress(data) }}
                />
            </View>
        </View>
    )
}


export default SubmissionItem;


const getStyles = () => {
    const { darkMode } = useDarkMode();

    return StyleSheet.create({

        container: {
            borderColor: '#70707040',
            width: Dimensions.deviceWidth - 30,
            marginBottom: 5,
            marginTop: 5,
            borderRadius: 15,
            padding: 0,
            borderWidth: 0.3,
            alignSelf: 'center',
            backgroundColor: darkMode ? DarkMode.lightbackground : Colors.white
        },
        mainContainer: {
            width: Dimensions.deviceWidth,
            padding: 10,
            marginBottom: 0,
            marginTop: 0,
        },
        location: {
            width: 35,
            height: 35,
            marginHorizontal: 10
        },
        icon: {
            width: 25,
            height: 23,
            resizeMode: 'contain',
            marginBottom: 10,
            marginRight: 15,
        },
        button1: {
            justifyContent: 'center',
            marginTop: 5,
            marginBottom: 15
        },
        text1: {
            color: darkMode ? DarkMode.blue100 : Colors.blue400,
            fontSize: Dimensions.px15,
            fontWeight: '500'
        }

    })
}