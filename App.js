import React, { useEffect, useState, useRef } from 'react';
import { Platform, StyleSheet, UIManager, Text, TextInput, View, StatusBar, LogBox, SafeAreaView, PermissionsAndroid, Vibration, Linking, Alert } from 'react-native';
import AppMain from './src/App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from './src/constants';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import NavigationService from './src/navigation/RootNavigation';
import { PERMISSIONS, request, check, RESULTS } from 'react-native-permissions';


if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

Text.defaultProps = {
  ...(Text.defaultProps || {}),
  allowFontScaling: false,
};
TextInput.defaultProps = {
  ...(TextInput.defaultProps || {}),
  allowFontScaling: false,
};

LogBox.ignoreAllLogs();

function App() {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const navigationRef = useRef();
  const [deeplinkUrl, setDeeplinkUrl] = useState(null);


  useEffect(() => {
    requestPermissions();
  }, []);

  async function requestPermissions() {
    let missingPermissions = [];

    if (Platform.OS === 'android') {
      const locationGranted = await requestLocationPermissionAndroid();
      if (!locationGranted) missingPermissions.push('ubicación');

      const notificationGranted = await requestNotificationPermission();
      if (!notificationGranted) missingPermissions.push('notificaciones');
    } else {
      const locationGranted = await requestLocationPermissionIOS();
      //if (!locationGranted) missingPermissions.push('ubicación');

      const userPermissionGranted = await requestUserPermission();
      if (!userPermissionGranted) missingPermissions.push('notificaciones');
    }

    if (missingPermissions.length === 0) {
      setPermissionsGranted(true);
      initializeMessaging();
      unsubscribeOnTokenRefresh();
      inAppMessaging();
    } else {
      Alert.alert(
        'Permisos faltantes',
        `Faltan los siguientes permisos: ${missingPermissions.join(', ')}. ¿Deseas volver a intentarlo?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reintentar', onPress: requestPermissions }
        ]
      );
      console.warn("No se concedieron todos los permisos.");
    }
    }
  

    // Solicitar permisos de ubicación en Android
    async function requestLocationPermissionAndroid() {
      try {
        const fineLocationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Permiso de ubicación",
            message: "Esta aplicación necesita acceder a tu ubicación todo el tiempo para funcionar correctamente.",
            buttonNeutral: "Preguntar después",
            buttonNegative: "Cancelar",
            buttonPositive: "Permitir",
          }
        );
  
        if (fineLocationGranted === PermissionsAndroid.RESULTS.GRANTED) {
          if (Platform.Version >= 29) {
            const backgroundLocationGranted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
              {
                title: "Permiso de ubicación en segundo plano",
                message: "Esta aplicación necesita acceso a tu ubicación incluso en segundo plano para monitorear tu posición constantemente.",
                buttonNeutral: "Preguntar después",
                buttonNegative: "Cancelar",
                buttonPositive: "Permitir",
              }
            );
  
            if (backgroundLocationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
              Alert.alert("Permiso denegado", "La aplicación no funcionará correctamente sin el permiso de ubicación en segundo plano.");
              return false;
            }
          }
          return true;
        } else {
          Alert.alert("Permiso denegado", "La aplicación necesita permisos de ubicación para funcionar.");
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }

    // Solicitar permisos de ubicación en iOS
  async function requestLocationPermissionIOS() {
    const locationPermission = PERMISSIONS.IOS.LOCATION_ALWAYS;

    const result = await check(locationPermission);
    if (result === RESULTS.GRANTED) {
      console.log('Permiso de ubicación ya otorgado.');
      return true;
    } else {
      const requestResult = await request(locationPermission);

      if (requestResult === RESULTS.GRANTED) {
        console.log('Permiso de ubicación concedido.');
        startTrackingLocation();

        return true;
      } else {
        Alert.alert("Permiso denegado", "La aplicación necesita permisos de ubicación para funcionar.");
        return false;
      }
    }
  }

  // Función para iniciar la obtención de ubicación
function startTrackingLocation() {
  Geolocation.watchPosition(
    (position) => {
      console.log('Ubicación actualizada:', position);
    },
    (error) => {
      console.error('Error al obtener la ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación en segundo plano.');
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 10,  // Se obtendrá una actualización cada 10 metros
      interval: 5000,  // 10 segundos
      fastestInterval: 5000,  // 5 segundos como intervalo más rápido
      showsBackgroundLocationIndicator: true, // Para iOS, muestra un indicador si está en segundo plano
    }
  );
}

  async function requestNotificationPermission() {
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return false;
    }
  }

  async function requestUserPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('Error al solicitar permisos de Firebase:', error);
      return false;
    }
  }

  async function initializeMessaging() {
    const fcmToken = await getToken();
    if (fcmToken) {
      console.log('FCM token:', fcmToken);
    }
    messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed: ', token);
    });
    messaging().onMessage(async (remoteMessage) => {
      const { title, body } = remoteMessage.notification || {};
      console.log('Received message:', title);
      displayNotification(title, body);
    });
  }

  async function getToken() {
    try {
      let fcmToken = await AsyncStorage.getItem('fcmToken');
      if (!fcmToken) {
        fcmToken = await messaging().getToken();
        await AsyncStorage.setItem('fcmToken', fcmToken);
      }
      return fcmToken;
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }


  async function inAppMessaging() {
    try {
      const request = await messaging().setAutoInitEnabled(true)
      console.log('App Messaging:', request)
    } catch (error) {
      console.log(error)
      throw error
    }
  }


  const unsubscribeOnTokenRefresh = messaging().onTokenRefresh((token) => {
    console.log('FCM token refreshed: ', token);
  });


  // Manejar la recepción de notificaciones
  useEffect(() => {
    const unsubscribeMessaging = messaging().onMessage(async (remoteMessage) => {
      const { title, body } = remoteMessage.notification || {};
      console.log('Received message: ' + title);
      displayNotification(title, body);
    });
    return () => {
      unsubscribeMessaging();
    };
  }, []);

  const displayNotification = async (title, body) => {
    await notifee.requestPermission();
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
      },
    });
  };

  const handleDeepLink = (event) => {
    const url = event.url;
    console.log(url, 'urllll');
    // Analiza la URL para manejar diferentes rutas o parámetros
    const route = url.replace(/.*?:\/\//g, '');
    const [path, queryString] = route.split('?');
    const params = queryString ? queryString.split('&').reduce((acc, param) => {
      const [key, value] = param.split('=');
      acc[key] = value;
      return acc;
    }, {}) : {};
  };

  useEffect(() => {

    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);
    // Check if app was opened from a deep link
    console.log(linkingSubscription, 'linkingSubscription');
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    if (deeplinkUrl) {
      //handleDeepLink(deeplinkUrl);
    }

    return () => {
      linkingSubscription.remove();
    };
  }, [deeplinkUrl]);



  if (!permissionsGranted) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Solicitando permisos, por favor espere...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent={true} backgroundColor={'#00000035'} />
      <AppMain />
    </View>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.lightbackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightbackground,
  },
});
