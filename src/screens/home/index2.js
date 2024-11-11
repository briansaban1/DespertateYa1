import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { View, ScrollView, Animated, RefreshControl, Platform, Appearance, StatusBar, Text, ActivityIndicator, PermissionsAndroid } from 'react-native';
import getStyles from './styles';
import moment from 'moment';
import 'moment/locale/es';
import Geolocation from 'react-native-geolocation-service';
import CompassHeading from 'react-native-compass-heading';

const JERUSALEM_COORDS = { latitude: 31.7683, longitude: 35.2137 };


function HomeScreen1() {
  const styles = getStyles();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heading, setHeading] = useState(0);
  const [location, setLocation] = useState(null);
  const [timezone1, setTimeZone] = useState(null);
  const rotateValue = new Animated.Value(0);

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
        setError(error);
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
      const response = await axios.get(`https://www.hebcal.com/shabbat?cfg=json&latitude=${coords.latitude}&longitude=${coords.longitude}&tzid=${timeZone.data.timeZone}&M=on&b=0&lg=es`);
      const calendario = await axios.get(`https://www.hebcal.com/converter?cfg=json&date=${moment(new Date).format("YYYY-MM-DD")}&g2h=1&strict=1`);

      const items = response.data.items;

      const fechahebrew = {
        fecha: calendario.data.hd +' '+ calendario.data.hm +' '+ calendario.data.hy,
        heb: calendario.data.hebrew
      }
      console.log(fechahebrew)


      // Filtra los items para obtener las fechas y el título deseado
      const candleLighting = items.find(item => item.category === 'candles');
      const havdalah = items.find(item => item.category === 'havdalah');
      const parasha = items.find(item => item.category === 'parashat');

      setTimeZone(timeZone.data.timeZone);

      const candleLightingTime = candleLighting ? candleLighting.date : null;
      const havdalahTime = havdalah ? havdalah.date : null;
      const parashaTitle = parasha ? parasha.title : null;

      const dia = moment(candleLightingTime).format("DD/MM/YYYY");
      const hora = moment(candleLightingTime).format("HH:mm A");
      const diaConcluye = moment(havdalahTime).format("DD/MM/YYYY");
      const horaConcluye = moment(havdalahTime).format("HH:mm A");

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





  const calculateHeading = (currentCoords, targetCoords) => {
    const { latitude: lat1, longitude: lon1 } = currentCoords;
    const { latitude: lat2, longitude: lon2 } = targetCoords;

    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;

    return (brng + 360) % 360;
  };
  

  useEffect(() => {
    requestLocationPermission().then((hasPermission) => {
      if (hasPermission) {
        fetchLocation();
      } else {
        setLoading(false);
        setError('Location permission denied');
      }
    });

    const degreeUpdateRate = 0;

    CompassHeading.start(degreeUpdateRate, ({ heading, accuracy }) => {
        setHeading(heading);
        // Rotate the compass image
        Animated.timing(rotateValue, {
            toValue: heading,
            duration: 100,
            useNativeDriver: false,
        }).start();
    });

    return () => {
        CompassHeading.stop();
    };
  
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

  const targetHeading = location ? calculateHeading(location, JERUSALEM_COORDS) : 0;
  const compassHeading = (heading - targetHeading + 360) % 360;



const rotateStyle = {
    transform: [{ rotate: `${-compassHeading}deg` }],
};

const getCardinalDirection = () => {
    const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
    const index = Math.round(compassHeading / 45) % 8;
    return directions[index];
};

  return (
    <>
      <ScrollView>
        <View style={styles.container}>
          <Text>Shabbat Times:</Text>
          <View style={{ marginTop: 10 }}></View>
          {data && (
            <View>
              <Text>Encendido de Velas</Text>
              <Text>Fecha: {data.dia}</Text>
              <Text>Hora: {data.hora}</Text>

              <View style={{ marginTop: 10 }}></View>

              <Text>Shabat concluye</Text>
              <Text>Fecha: {data.diaConcluye}</Text>
              <Text>Hora: {data.horaConcluye}</Text>
              <View style={{ marginTop: 10 }}></View>

              <Text>Parashá de la semana:</Text>
              <Text>{data.parashat}</Text>
              <View style={{ marginTop: 10 }}></View>
              
              <Text>Fecha Hebrea:</Text>
              <Text>{data.fechahebrew.fecha}</Text>
              <Text>{data.fechahebrew.heb}</Text>

            </View>
          )}
          <View style={{ marginTop: 30 }}></View>

          {location && (
            <View>
              <Text>Ubicación Actual:</Text>
              <Text>Latitud: {location.latitude}</Text>
              <Text>Longitud: {location.longitude}</Text>
              <Text>{timezone1}</Text>
            </View>
          )}
        </View>

        <View style={styles.container}>
            <Text style={styles.appName}>Jerusalem Brújula</Text>
            <View style={styles.compassContainer}>
                <Animated.Image
                    source={
                    require('../../assets/compass.png')
                  }
                    style={[styles.compassImage, rotateStyle]}
                />
            </View>
            <Text style={styles.headingValue}>{`Heading: ${heading.toFixed(
                2
            )}°`}</Text>
            <Text
                style={styles.cardinalDirection}
            >{`Dirección: ${getCardinalDirection()}`}</Text>
        </View>

      </ScrollView>
    </>
  );
}

export default HomeScreen1;
