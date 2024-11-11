import { useNavigation, DrawerActions } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Images from '../../constants/images';
import Screens from '../../constants/screens';
import { useDarkMode } from '../../DarkModeContext';
import { Colors, DarkMode } from '../../constants';
import ImageButton from '../../components/ImageButton';
import axios from 'axios';
import { View, ScrollView, Animated, RefreshControl, Platform, Appearance, StatusBar, Text, ActivityIndicator, PermissionsAndroid, SafeAreaView, TouchableOpacity, Image, Vibration } from 'react-native';
import getStyles from './styles';
import 'moment/locale/es';
import Geolocation from 'react-native-geolocation-service';
import Block from './Block';
import moment from 'moment-timezone';
import UserAvatar from '../../components/UserAvatar';
import LottieView from "lottie-react-native";
import Dimension from '../../constants/dimensions';
import ImageBanner from '../../components/Carousel';
import Boxes from '../../components/Boxes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SubmissionItem from '../../components/news';
import { Notifications } from 'react-native-notifications';
import loadStateFromStorage from './alarma'



function HomeScreen() {
  const styles = getStyles();
  const { darkMode, setDarkMode } = useDarkMode();
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heading, setHeading] = useState(0);
  const [location, setLocation] = useState('');
  const [timezone1, setTimeZone] = useState(null);
  const rotateValue = new Animated.Value(0);

  const toggleDrawer = (fechahebrew) => {
    console.log(fechahebrew); // Usa el parámetro como necesites
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the location');
          return true;
        } else {
          console.log('Location permission denied');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true;
    }
  };


  const fetchLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
        fetchData(position.coords);
      },
      (error) => {
        console.error(error);
        setLoading(false);
        setError('Error al obtener la ubicación');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };



  const fetchData = async (coords) => {
    try {
      const timeZone = await axios.get(`https://timeapi.io/api/Time/current/coordinate?latitude=${coords.latitude}&longitude=${coords.longitude}`)
      setTimeZone(timeZone.data.timeZone);

      const response = await axios.get(`https://www.hebcal.com/shabbat?cfg=json&latitude=${coords.latitude}&longitude=${coords.longitude}&tzid=${timeZone.data.timeZone}&M=on&b=0&lg=es`);
      const items = response.data.items;

      // Filtra los items para obtener las fechas y el título deseado
      const candleLighting = items.find(item => item.category === 'candles');
      const havdalah = items.find(item => item.category === 'havdalah');
      const parasha = items.find(item => item.category === 'parashat');

      const candleLightingTime = candleLighting ? candleLighting.date : null;
      const havdalahTime = havdalah ? havdalah.date : null;
      const parashaTitle = parasha ? parasha.title : null;


      const dia = moment.tz(candleLightingTime, timeZone.data.timeZone).format("DD/MM/YYYY");
      const hora = moment.tz(candleLightingTime, timeZone.data.timeZone).format("HH:mm A");
      const diaConcluye = moment.tz(havdalahTime, timeZone.data.timeZone).format("DD/MM/YYYY");
      const horaConcluye = moment.tz(havdalahTime, timeZone.data.timeZone).format("HH:mm A");

      const calendario = await axios.get(`https://www.hebcal.com/converter?cfg=json&date=${moment(new Date).format("YYYY-MM-DD")}&g2h=1&strict=1`);
      const fechahebrew = {
        fecha: calendario.data.hd + ' ' + calendario.data.hm + ' ' + calendario.data.hy,
        heb: calendario.data.hebrew
      }
      console.log(fechahebrew)

      await storeData('fechahebrew', JSON.stringify(fechahebrew));


      const parsedData = {
        dia,
        hora,
        diaConcluye,
        horaConcluye,
        parashat: parashaTitle,
        fechahebrew
      };

      setData(parsedData);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  const storeData = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      throw error;
    }
  }


  useEffect(() => {
    requestLocationPermission().then((hasPermission) => {
      if (hasPermission) {
        fetchLocation();
      } else {
        setLoading(false);
        setError('Location permission denied');
      }
    });
  }, []);


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await wait(2000);

    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error fetching data: {error.message}</Text>
      </View>
    );
  }



  return (
    <>
      <ScrollView
        style={styles.container}
        bounces={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        contentContainerStyle={[refreshing && { marginTop: Platform.OS === 'ios' ? 70 : 10 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={Platform.OS === 'ios' ? 60 : 20}
            colors={styles.refreshControlColors}
            tintColor={styles.refreshControlColorsIOS}
            progressBackgroundColor={styles.refreshControlBackgroundColor}
          />
        }>
        <StatusBar barStyle={darkMode || colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View>
          <SafeAreaView />
          <View style={styles.flexBetweenWrapper} paddingHorizontal={20} >
            <ImageButton
              source={darkMode ? Images.MenuWhite : Images.Menu}
              imageStyle={styles.headerIcon}
              onPress={() => { toggleDrawer(data.fechahebrew.fecha) }}

            />
            <View style={{ flexDirection: 'row', alignItems: 'center', }}>
              <UserAvatar />
              <Text style={styles.hello}>
                {"Hola, "}
                {<Text style={styles.username}>{'Brian!'}</Text>}
              </Text>
            </View>
          </View>          

          <View style={{ height: Platform.OS == 'android' ? 20 : 25 }}></View>

          <View style={{
            backgroundColor: darkMode ? DarkMode.lightbackground : "#fff",
            marginTop: 5,
            borderRadius: 10,
            margin: 15,
            marginBottom: 5,
            padding: 10
          }}>
            <View style={{ paddingHorizontal: 5, alignSelf: 'flex-end' }}>
              <TouchableOpacity
                onPress={() => {
                  fetchData(location)
                }}>
                <Image
                  source={require('../../assets/icons8-reiniciar-50.png')}
                  style={[
                    {
                      resizeMode: 'contain',
                      width: 15,
                      height: 15,
                      marginTop: -0
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>
            <View style={{ width: '80%', flexDirection: 'row', alignItems: 'center' }}>

              <LottieView
                source={require("../../assets/Animation - 1720720547148.json")}
                style={{ width: "45%", height: "180%", marginLeft: -10 }}
                autoPlay
                loop
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '55%', alignItems: 'center' }}>
                <View style={{ alignItems: 'flex-start', width: '55%' }}>
                  <Text style={{ fontSize: Dimension.px17, color: Colors.darkblue, fontWeight: '600' }}>Encendido de Velas</Text>
                  <Text style={{ fontSize: Dimension.px15, color: Colors.lightblue, fontWeight: '400', marginTop: 5 }}>{data.dia + ' ' + data.hora}</Text>
                </View>
                <View style={{
                  width: '8%', height: 80,
                  width: 0.8,
                  backgroundColor: darkMode ? DarkMode.blue50 : '#e3e3e3',
                  marginLeft: 15, marginRight: 15
                }} />
                <View style={{ alignItems: 'flex-start', width: '55%' }}>
                  <Text style={{ fontSize: Dimension.px17, color: Colors.darkblue, fontWeight: '600' }}>Shabat Concluye</Text>
                  <Text style={{ fontSize: Dimension.px15, color: Colors.lightblue, fontWeight: '400', marginTop: 5 }}>{data.diaConcluye + ' ' + data.horaConcluye}</Text>
                </View>
              </View>
            </View>
            <View style={{ marginTop: 25, flexDirection: 'row', marginLeft: 5, }}>
              <Text style={{ fontSize: Dimension.px16, color: Colors.darkblue, fontWeight: '700' }}>Lectura de la Torá: </Text>
              <Text style={{ fontSize: Dimension.px16, color: Colors.blue400, fontWeight: '500' }}>{data.parashat}</Text>
            </View>
          </View>

        </View>

        <SafeAreaView style={{ flex: 1 }}>

          <View style={{ height: 10 }} />
          <Boxes />
          <View style={{ height: 20 }} />
          <Text style={styles.novedades_title}>{"Últimas Novedades"}</Text>
          <ImageBanner />
        </SafeAreaView>
        <View style={{ height: 20 }} />
        <SafeAreaView style={styles.container}>

        <SubmissionItem key={'index'} data={''} profile={''} onPress={'onSelectData'} />
        <SubmissionItem key={'index'} data={''} profile={''} onPress={'onSelectData'} />



        </SafeAreaView>

        <View>
        </View>

        <View style={{ height: 20 }} />

      </ScrollView>
    </>
  )
};
export default HomeScreen;