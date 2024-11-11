import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Image, ScrollView, SafeAreaView, Platform, Text } from 'react-native';
import getStyles from './styles';
import { FlexBetweenWrapper, Heading2, AppText, Divider, FlexWrapper, Space } from '../../components/styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { Dimensions, Colors, DarkMode } from '../../constants';
import { useNavigation } from '@react-navigation/native';
import packageJson from '../../../package.json'
import Screens from '../../constants/screens';
import { useDarkMode } from '../../DarkModeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';


function InfoButton({ label, source, screen }) {
    const { navigate } = useNavigation();
    const { darkMode } = useDarkMode();
    const styles = getStyles(); // Obtén los estilos
    return (
        <TouchableOpacity
            onPress={() => {
                navigate(screen)
            }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
            <Image source={source} style={{ width: 30, height: 30 }} />
            <Text style={{ color: darkMode ? DarkMode.white : Colors.blue400, fontSize: Dimensions.px14 }}>{label}</Text>
        </TouchableOpacity>
    )
}

function MenuButton({ label, source, screen }) {
    const { navigate, reset } = useNavigation();
    //const dispatch = useDispatch();
    const { darkMode } = useDarkMode();
    const styles = getStyles(); // Obtén los estilos

    return (
        <TouchableOpacity
            onPress={() => {
                if (screen !== 'logout') {
                    navigate(screen)
                } else {

                }
            }}
            style={styles.menuButton}
        >
            <View style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>

                <Image
                    source={source}
                    style={{ width: 22, height: 22, resizeMode: 'contain', marginRight: 12 }}
                />
                <Text style={{ color: darkMode ? DarkMode.white : Colors.blue400, fontSize: Dimensions.px15 }}>{label}</Text>
            </View>
            {
                screen !== 'logout' && <Image
                    source={darkMode ? require('../../assets/ios-arrow-right.png') : require('../../assets/ios-arrow-right.png')}
                    style={{ width: 12, height: 14, resizeMode: 'contain' }}
                />
            }
        </TouchableOpacity>
    )
}


function SideMenu({ fechahebrew }) {

    const { darkMode } = useDarkMode();
    const styles = getStyles(); // Obtén los estilos

    const [fechaHebrew, setFechaHebrew] = useState(null);

    const getFechaHebrew = async () => {
        try {
            const value = await AsyncStorage.getItem('fechahebrew');
            if (value !== null) {
                setFechaHebrew(JSON.parse(value));
            }
        } catch (error) {
            // Manejar error
        }
    }

    useEffect(() => {
        getFechaHebrew();
    }, []);

    return (
        <ScrollView style={styles.container} bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}>
            <SafeAreaView />
            <View style={{ width: '100%', marginTop: Platform.OS == 'android' ? 47 : 8, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }} paddingHorizontal={20} marginTop={20}>
                <View style={{ width: Dimensions.deviceWidth - 170, marginTop: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={{ color: darkMode ? DarkMode.blue50 : Colors.lightblue, fontSize: Dimensions.px20, fontWeight: '500', }}>
                            {"Hola,"}
                        </Text>
                        <Text style={styles.username}>{('Brian!')}</Text>
                    </View>
                    <View style={{ justifyContent: 'space-between', alignSelf: 'center' }}>
                        {fechaHebrew ? (<View>
                            <Text style={{ color: darkMode ? DarkMode.blue50 : Colors.blue400, fontSize: Dimensions.px14, fontWeight: '500', }}>
                                {` ${fechaHebrew.fecha}`}
                                </Text>
                                <Text style={{ color: darkMode ? DarkMode.blue50 : Colors.blue400, fontSize: Dimensions.px14, fontWeight: '500', }}>
                                {`${fechaHebrew.heb}`}
                                </Text>
                                </View>
                        ) : (
                            ''
                        )}
                    </View>
                </View>

            </View>
            <View style={styles.card}>
                <InfoButton label={'Mi Perfil'} source={require('../../assets/icons8-test-account-80.png')} screen={Screens.Profile} />
                <InfoButton label={'Notificaciones'} source={require('../../assets/icons8-notification-80.png')} screen={"Funcionamiento"} />
            </View>
            <Text style={[styles.subLabel, { marginBottom: 10, marginTop: 5 }]}>{"Mi Cuenta"}</Text>
            <View style={{ height: 1, backgroundColor: Colors.border }} />
            <MenuButton
                label={"Noticias y Novedades"}
                source={darkMode ? require('../../assets/icons8-news-80.png') : require('../../assets/icons8-news-80.png')}
                screen={Screens.Alarma}
            />
            <View style={{ height: 1, backgroundColor: Colors.border }} />

            <MenuButton
                label={"Calendario"}
                source={darkMode ? require('../../assets/icons8-calendar-80.png') : require('../../assets/icons8-calendar-80.png')}
                screen={Screens.Alertar}
            />
            <View style={{ height: 1, backgroundColor: Colors.border }} />
            <MenuButton
                label={"Conversor de Fechas"}
                source={darkMode ? require('../../assets/icons8-refresh-80.png') : require('../../assets/icons8-refresh-80.png')}
                screen={Screens.Calculadora}
            />
            <View style={{ height: 1, backgroundColor: Colors.border }} />
            <MenuButton
                label={"Brujula"}
                source={darkMode ? require('../../assets/icons8-compass-80.png') : require('../../assets/icons8-compass-80.png')}
                screen={Screens.Brujula}
            />
            
            <View style={{ height: 1, backgroundColor: Colors.border }} />
            <Text style={[styles.subLabel, { marginBottom: 10, marginTop: 20 }]}>{"Opciones"}</Text>
            <View style={{ height: 1, backgroundColor: Colors.border }} />
            <MenuButton
                label={"Configuración"}
                source={darkMode ? require('../../assets/icons8-database-administrator-80.png') : require('../../assets/icons8-database-administrator-80.png')}
                screen={"Funcionamiento"}
            />
            <View style={{ height: 1, backgroundColor: Colors.border }} />
            <MenuButton
                label={"Contactanos"}
                source={darkMode ? require('../../assets/home.png') : require('../../assets/icons8-at-sign-80.png')}
                screen={"Puntos"}
            />
            <View style={{ height: 1, backgroundColor: Colors.border }} />
            <View height={20} width={'100%'} />
            <View style={{ height: 1, backgroundColor: Colors.border }} />
            <MenuButton
                label={"Cerrar sesión"}
                source={darkMode ? require('../../assets/icons8-logout-80.png') : require('../../assets/icons8-logout-80.png')}
                screen={"logout"}
            />
            <View style={{ height: 1, backgroundColor: Colors.border }} />
            <Text style={{ padding: 15, fontSize: 13, marginBottom: Platform.OS == 'android' ? 0 : 20, color: darkMode ? DarkMode.white : Colors.blue400 }}>{`Versión  ${packageJson.version}`}</Text>
        </ScrollView>
    );
}

export default SideMenu;
