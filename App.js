import React, { useEffect, useState, useRef } from 'react';
import { Platform, StyleSheet, UIManager, Text, TextInput, View, StatusBar, LogBox, SafeAreaView, PermissionsAndroid, Vibration, Linking, Alert, AppState, BackHandler } from 'react-native';
import AppMain from './src/App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from './src/constants';
import Geolocation from '@react-native-community/geolocation';

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
  const [watchId, setWatchId] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [estado, setEstado] = useState(false);


  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'ios' && estado) {
      const handleAppStateChange = (nextAppState) => {
        if (appState.match(/inactive|background/) && nextAppState === 'active') {
          // La app ha vuelto del segundo plano, solicita el permiso de nuevo
          requestPermissions();
        }
        setAppState(nextAppState);
      };

      const appStateListener = AppState.addEventListener('change', handleAppStateChange);

      // Limpieza: eliminar el listener cuando el componente se desmonte
      return () => {
        appStateListener.remove();
        setEstado(false);

      };
    }
  }, [appState]);

  async function requestPermissions() {
    let missingPermissions = [];

    if (Platform.OS === 'android') {
      const locationGranted = await requestLocationPermissionAndroid();
      if (!locationGranted) missingPermissions.push('ubicación');

      const notificationGranted = await requestNotificationPermission();
      if (!notificationGranted) missingPermissions.push('notificaciones');
    } else {
      //const userPermissionGranted = 
      await requestUserPermission();
      //if (!userPermissionGranted) missingPermissions.push('notificaciones');
      //await requestLocationPermissionIOS();
      //if (!locationGranted) missingPermissions.push('ubicación');
    }

    if (missingPermissions.length === 0) {
      setPermissionsGranted(true);
      initializeMessaging();
      unsubscribeOnTokenRefresh();
      inAppMessaging();
    } else {
      Alert.alert(
        'Se requieren algunos Permisos',
        `Faltan los siguientes permisos: ${missingPermissions.map(permission => permission.toUpperCase()).join(', ')}. ¿Deseás volver a intentarlo?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Reintentar', onPress: () => {
              if (Platform.OS === 'android') {
                requestLocationPermissionAndroid();
                requestNotificationPermission();
              } else {
                requestUserPermission();
                requestLocationPermissionIOS();
              }
            }
          }
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

  async function requestLocationPermissionIOS() {
    // Solicitar permiso para "Cuando la app está en uso" primero

    try {
      const whenInUsePermission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      const alwaysPermission = PERMISSIONS.IOS.LOCATION_ALWAYS;

      // Primero verifica si ya tenemos el permiso "Siempre"
      let result = await check(alwaysPermission);

      if (result === RESULTS.GRANTED) {
        console.log('Permiso de ubicación "Siempre" ya otorgado.');
        return true;
      } else {

      // Si no tenemos "Siempre", verificar y solicitar "Cuando la app está en uso"
      result = await check(whenInUsePermission);

      if (result === RESULTS.GRANTED) {
        console.log('Permiso de ubicación "Cuando la app está en uso" ya otorgado.');
      } else {
        // Solicitar "Cuando la app está en uso" si no está otorgado
        const requestResult = await request(whenInUsePermission);
        if (requestResult !== RESULTS.GRANTED) {
          Alert.alert("Permiso denegado App", "La aplicación necesita permisos de ubicación para funcionar.",
            [
              { text: "Abrir Configuración", onPress: () => { Linking.openSettings(); setEstado(true); } },
              { text: "Cancelar", style: "cancel", onPress: () => {BackHandler.exitApp()}  }
            ]
          );
          return false;
        }
      }

      // Ahora, intenta solicitar "Siempre" si es necesario
      const requestAlwaysResult = await request(alwaysPermission);

      if (requestAlwaysResult === RESULTS.GRANTED) {
        console.log('Permiso de ubicación "Siempre" concedido.');
        startTrackingLocation();
        return true;
      } else {
        Alert.alert(
          "Permiso de Ubicación App",
          "Es indespensable para monitorear tu ubicación en segundo plano, habilitar el permiso de ubicación \"Siempre\" en el panel de Configuración.",
          [
            { text: "Abrir Configuración", onPress: () => { Linking.openSettings(); setEstado(true); } },
            { text: "Cancelar", style: "cancel", onPress: () => {BackHandler.exitApp()}  }
          ]
        );
        return false;
      };
    };
    } catch (error) {
      console.error('Error al solicitar permisos de ubicación en IOS: ', error);
      return false;
    };
  };

  // Función para iniciar la obtención de ubicación
  function startTrackingLocation() {
    Geolocation.getCurrentPosition(

      position => {
        console.log('ok1')
        const { latitude, longitude } = position.coords;
        console.log({ latitude, longitude });
        setCurrentLocation({ latitude, longitude });
        setLoading(false); // Detener el loading una vez que se obtiene la ubicación

      },
      error => {
        console.error(error);
        setLoading(false);
        setError('Error al obtener la ubicación');
      },
      {
        enableHighAccuracy: true,
        interval: 1000, // Cada 1 segundo
        fastestInterval: 1000, // Actualización más frecuente
      }
    );
    const watchId = Geolocation.watchPosition(

      position => {
        const { latitude, longitude } = position.coords;
        console.log({ latitude, longitude });

        // Verifica si las coordenadas han cambiado antes de actualizar el estado
        if (!currentLocation ||
          latitude !== currentLocation.latitude ||
          longitude !== currentLocation.longitude
        ) {
          setCurrentLocation({ latitude, longitude });
          setLoading(false); // Detener el loading una vez que se obtiene la ubicación
        }
      },
      error => {
        console.error(error);
        setLoading(false);
        setError('Error al obtener la ubicación');
      },
      {
        enableHighAccuracy: true,
        interval: 1000, // Cada 1 segundo
        fastestInterval: 1000, // Actualización más frecuente
      }
    );

    // Guardar el watchId para poder detenerlo después si es necesario
    setWatchId(watchId);
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
    const handleDeepLink = (event) => {
      const url = event.url;
      console.log(`Deep link recibido: ${url}`);
      // Lógica para manejar el enlace profundo
    };

    const initializeLinking = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          handleDeepLink({ url: initialUrl });
          console.log(initialUrl, 'initialUrl')
        }
      } catch (error) {
        console.error("Error al obtener la URL inicial:", error);
      }
    };

    const linkingSubscription = Linking.addListener('url', handleDeepLink);
    initializeLinking();

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
