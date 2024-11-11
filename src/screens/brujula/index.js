import React, { useEffect, useState } from 'react';
import { View, ScrollView, Animated, RefreshControl, Platform, Appearance, StatusBar, Text, ActivityIndicator, PermissionsAndroid } from 'react-native';
import { Header } from '../../components';
import getStyles from './styles';
import { Colors, Dimensions, DarkMode } from '../../constants';
import { useSelector, useDispatch } from 'react-redux';
import ImageButton from '../../components/ImageButton';
import { useDarkMode } from '../../DarkModeContext';
import Geolocation from 'react-native-geolocation-service';
import CompassHeading from 'react-native-compass-heading';

const JERUSALEM_COORDS = { latitude: 31.7683, longitude: 35.2137 };



function BrujulaScreen() {

  const { darkMode } = useDarkMode();
  const styles = getStyles(); // Obtén los estilos
  const [loading1, setLoadng1] = useState(false)
  const rotateValue = new Animated.Value(0);
  const [heading, setHeading] = useState(0);
  const [location, setLocation] = useState(null);


  useEffect(() => {

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


  const calculateHeading = (currentCoords, targetCoords) => {
    const { latitude: lat1, longitude: lon1 } = currentCoords;
    const { latitude: lat2, longitude: lon2 } = targetCoords;

    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;

    return (brng + 360) % 360;
  };

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
    <ScrollView
      bounces={false}
      overScrollMode="never"
      style={styles.container} contentContainerStyle={{ paddingBottom: 35 }} showsVerticalScrollIndicator={false}>
      <Header
        title={"Brujula"}
      />

<View style={styles.container}>
            <Text >Jerusalem Brújula</Text>
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
  );
}


export default BrujulaScreen;
