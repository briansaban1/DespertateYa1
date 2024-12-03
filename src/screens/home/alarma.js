import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Modal, Button, Alert, PermissionsAndroid, Text, TextInput, Vibration, TouchableOpacity, Image, AppState, NativeModules, KeyboardAvoidingView, Platform, Animated, PanResponder, AppRegistry, Keyboard, TouchableWithoutFeedback, Linking } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Circle, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import SoundPlayer from 'react-native-sound-player';
import 'react-native-get-random-values';
import BackgroundTimer from 'react-native-background-timer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { EventType, AndroidImportance, AndroidColor, AndroidStyle, AndroidForegroundServiceType } from '@notifee/react-native';
import LottieView from "lottie-react-native";
import { VolumeManager, useRingerMode, RINGER_MODE } from 'react-native-volume-manager';
import BackgroundActions from 'react-native-background-actions';
import WalkthroughTooltip from 'react-native-walkthrough-tooltip';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { ScrollView } from 'react-native-gesture-handler';


function AlarmaScreen({ route }) {
  const { data } = route.params || {}; // Obtiene los datos de la notificación
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedDistance, setSelectedDistance] = useState(''); // Default 500m
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null); // Create a ref for the MapView
  const [direccion, setDireccion] = useState('');
  const [vibrationInterval, setVibrationInterval] = useState(null); // Usamos el estado para el intervalo
  const [isModalShown, setIsModalShown] = useState(false); // Nuevo estado para controlar el modal
  const [storedAddresses, setStoredAddresses] = useState([]); // Estado para las direcciones guardadas
  const [modalPosition] = useState(new Animated.Value(0)); // Posición para el modal deslizable
  const [verdadero, setVerdadero] = useState();
  const [modalVisibleError, setModalVisibleError] = useState(false);
  const [isFocused, setIsFocused] = useState(false); // Controla si el campo está enfocado
  const [watchId, setWatchId] = useState(null);
  const [datos, setDatos] = useState('');
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [tooltipStep, setTooltipStep] = useState(1); // Controlamos el paso del tooltip
  const [isHelpModalVisible, setHelpModalVisible] = useState(false);
  const [estado, setEstado] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [openModalAutocomplete, setOpenModalAutocomplete] = useState(false); // Nuevo estado para controlar el modal
  const [datos1, setDatos1] = useState('');


  const toggleHelpModal = () => setHelpModalVisible(!isHelpModalVisible);


  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const tutorialSeen = await AsyncStorage.getItem('tutorialSeen');
        if (!tutorialSeen) {
          setIsTutorialVisible(true);
        }
      } catch (error) {
        console.warn('Error tutorial', error)
      }
    };

    checkTutorialStatus();
  }, []);

  const handleCloseTutorial = async () => {
    try {
      await AsyncStorage.setItem('tutorialSeen', 'true');
      setIsTutorialVisible(false);
      setTooltipStep(0);
      console.log('falso');
    } catch (error) {
      console.warn('Error saving tutorial state', error);
    }
  };


  const options = {
    taskName: 'Ubicación',
    taskTitle: 'Monitoreando tu ubicación',
    taskDesc: 'La app está monitoreando tu proximidad en segundo plano.',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: '#ff0000',
    linkingURI: 'com.despertateya://',
    parameters: {
      delay: 1000, // Cada segundo
    },
  };

  const startBackgroundTask = async () => {
    await BackgroundActions.start(backgroundTask, options);
  };

  const intervalIdRef = useRef(null); // Usa useRef para mantener el id del intervalo
  const stopBackgroundTask = async () => {
    if (intervalIdRef.current !== null) {
      BackgroundTimer.clearInterval(intervalIdRef.current); // Limpia el intervalo activo
      intervalIdRef.current = null; // Restablece el id del intervalo
    }
    await BackgroundActions.stop();
    BackgroundTimer.stopBackgroundTimer();
  };

  const backgroundTask = () => {
    new Promise((resolve) => {
      intervalIdRef.current = BackgroundTimer.setInterval(() => {

        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            console.log('Ubicación en segundo plano:', latitude, longitude);
            setCurrentLocation({ latitude, longitude });
            setLoading(false);

            const distance = getDistance({ latitude, longitude }, {
              latitude: selectedAddress.latitude,
              longitude: selectedAddress.longitude
            });
            const initialDistance = parseFloat(selectedDistance);
            const progress = calculateProgress(distance, initialDistance);
            setDatos({ distance, initialDistance, progress })

            checkProximity(distance, initialDistance);

            displayProgressNotification(progress, distance)

          },
          error => {
            console.error(error)
          },
          { enableHighAccuracy: true, distanceFilter: 10 }
        );
      }, 5000);

      BackgroundTimer.start(); // Inicia el timer en segundo plano
    });
  };

  const cameFromSettings = useRef(false); // Variable para detectar regreso desde configuraciones

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log("Regresando a la aplicación desde Configuración");
        if (cameFromSettings.current) {
          // Si regresamos desde las configuraciones, verificar permisos
          cameFromSettings.current = false; // Resetear bandera
          checkAndRequestLocationPermissionIOS();
        }
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Limpieza del listener
    return () => {
      subscription.remove();
    };
  }, [appState]);
  
  const handleOpenSettings = () => {
    cameFromSettings.current = true; // Activar la bandera
    Linking.openSettings();
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      checkAndRequestLocationPermission();
    } else {
      checkAndRequestLocationPermissionIOS();
    }
    return () => {
      stopLocationWatch();
    };
  }, []);

  async function checkAndRequestLocationPermissionIOS() {
    setLoading(true);
    setError(false);
    try {
      // Solicitar permiso para "Cuando la app está en uso" primero
      const whenInUsePermission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      const alwaysPermission = PERMISSIONS.IOS.LOCATION_ALWAYS;

      // Primero verifica si ya tenemos el permiso "Siempre"
      let result = await check(alwaysPermission);

      if (result === RESULTS.GRANTED) {
        console.log('Permiso de ubicación "Siempre" ya otorgado.');
        fetchLocation();
        return true;
      } 

        // Si no tenemos "Siempre", verificar y solicitar "Cuando la app está en uso"
        result = await check(whenInUsePermission);
        if (result === RESULTS.GRANTED) {
          console.log('Permiso de ubicación "Cuando la app está en uso" ya otorgado.');
          Alert.alert(
            "Permiso de ubicación Cuando la app está en uso",
            "Es indespensable para monitorear tu ubicación en segundo plano, habilitar el permiso de ubicación \"Siempre\" en el panel de Configuración.",
            [
              { text: "Abrir Configuración", onPress: () => { handleOpenSettings(); setEstado(true); } },
            ]
          );
          fetchLocation();
          return true;
        } else {
          // Solicitar "Cuando la app está en uso" si no está otorgado
          const requestResult = await request(whenInUsePermission);
          if (requestResult !== RESULTS.GRANTED) {
            Alert.alert(
              "Permiso de ubicación denegado Alarma",
              "Es indespensable para monitorear tu ubicación en segundo plano, habilitar el permiso de ubicación \"Siempre\" en el panel de Configuración.",
              [
                { text: "Abrir Configuración", onPress: () => { handleOpenSettings(); setEstado(true); } },
              ]
            );
            fetchLocation();
            return true;
          }
        }
 
        // Ahora, intenta solicitar "Siempre" si es necesario
        const requestAlwaysResult = await request(alwaysPermission);

        if (requestAlwaysResult === RESULTS.GRANTED) {
          console.log('Permiso de ubicación "Siempre" concedido.');
          fetchLocation();
          return true;
        } else {
          Alert.alert(
            "Permiso de Ubicación Alarma",
            "Es indespensable para monitorear tu ubicación en segundo plano, habilitar el permiso de ubicación \"Siempre\" en el panel de Configuración.",
            [
              { text: "Abrir Configuración", onPress: () => { handleOpenSettings(); setEstado(true); } },
            ]
          );
        }
    } catch (error) {
      console.warn(error);
    }
  }

  const checkAndRequestLocationPermission = async () => {
    // Verifica si el permiso de ubicación ya está concedido
    const hasLocationPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    if (hasLocationPermission) {
      console.log('permiso ok')
      // Si el permiso ya fue otorgado, obten la ubicación
      fetchLocation();
    } else {
      // Si el permiso fue denegado, solicita el permiso de nuevo
      const granted = await requestLocationPermission();
      if (granted) {
        fetchLocation();
      } else {
        setError('Location permission denied');
      }
    }

    fetchLocation();
  };



  async function requestLocationPermission() {
    console.log('Checking permissions...');
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
          return true;
        } else {
          console.log('Location permission denied');
          return false;
        }
      } catch (err) {
        console.warn(err, 'erroooor');
        return false;
      }
    } else {
      return true;
    }
  };

  function rebuild() {
    Geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        console.log({ latitude, longitude });
        setCurrentLocation({ latitude, longitude });
        setLoading(false); // Detener el loading una vez que se obtiene la ubicación

        setWatchId(currentLocation);

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
  };


  const fetchLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        console.log('ok1')
        const { latitude, longitude } = position.coords;
        console.log('Ubicación en primer plano:', latitude, longitude);

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
        console.log('ok watch')
        const { latitude, longitude } = position.coords;
        console.log('Ubicación en primer plano:', latitude, longitude);
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
  };

  const stopLocationWatch = () => {
    // Detener el watch cuando sea necesario
    if (watchId) {
      Geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  useEffect(() => {
    if (mapRef.current && selectedAddress && currentLocation) {
      // Calcular el centro entre los dos puntos (currentLocation y selectedAddress)
      const latitude = (currentLocation.latitude + selectedAddress.latitude) / 2;
      const longitude = (currentLocation.longitude + selectedAddress.longitude) / 2;

      // Calcular el rango o "delta" para la región
      const latitudeDelta = Math.abs(currentLocation.latitude - selectedAddress.latitude) * 2;
      const longitudeDelta = Math.abs(currentLocation.longitude - selectedAddress.longitude) * 2;

      // Ajustar el mapa para que muestre ambos puntos
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta,
        },
        1000 // Duración de la animación en milisegundos
      );
    }
  }, [currentLocation, selectedAddress]);

  const handleSelectAddress = async (data, details) => {
    let route = '';
    let streetNumber = '';
    let sublocality = '';
    let filteredAddress = '';
    const addressComponents = details.address_components;

    // Filtramos y asignamos cada componente a su respectiva variable
    addressComponents.forEach((component) => {
      if (component.types.includes('route')) {
        route = component.short_name; // Nombre de la calle
      }
      if (component.types.includes('street_number')) {
        streetNumber = component.long_name; // Número de la calle
      }
      if (component.types.includes('locality')) {
        sublocality = component.long_name; // Localidad o barrio
      }
    });

    // Construimos la dirección en el orden deseado
    if (route) {
      filteredAddress += route;
    }
    if (streetNumber) {
      filteredAddress += ` ${streetNumber}`;
    }
    if (sublocality) {
      filteredAddress += `, ${sublocality}`; // Agregar sublocalidad después de una coma
    }

    const address = {
      description: filteredAddress.trim(), // Asignamos la dirección filtrada
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
    };
    setSelectedAddress(address);

  };

  // Eliminar dirección y distancia del AsyncStorage
  const deleteAddress = async (addressToDelete) => {
    const updatedAddresses = storedAddresses.filter(
      (addressData) => {
        // Filtra si la descripción de la dirección y la distancia son diferentes
        return addressData.address.description !== addressToDelete.address.description ||
          addressData.distance !== addressToDelete.distance;
      }
    );

    // Guardar las direcciones actualizadas en AsyncStorage
    await AsyncStorage.setItem('addresses', JSON.stringify(updatedAddresses));

    // Actualizar el estado local para reflejar los cambios
    setStoredAddresses(updatedAddresses);
  };




  const handleStopAlarm = () => {
    stopBackgroundTask();
    BackgroundActions.stop();
    notifee.stopForegroundService();
    contadorNotificacion = 0;
    notifee.cancelNotification('progress_notification'); // Cancela la notificación
    notifee.cancelNotification('default');
    stopVibrationPattern();
    Vibration.cancel();
    SoundPlayer.stop(); // Detener el sonido
    setIsAlarmActive(false);
    setSelectedAddress(null);
    setModalVisible(false);
    setIsModalShown(false);
    contador = 0;
  };

  const stopVibrationPattern = () => {

    Vibration.cancel(); // Cancela cualquier vibración activa
    BackgroundTimer.stop();
    setVibrationInterval(null); // Resetea el estado

  };

  const activateAlarm = async () => {
    if (!currentLocation || !selectedAddress || !selectedDistance) {
      setModalVisibleError(true);
      return;
    }

    setIsAlarmActive(true);
    startBackgroundTask();

    try {
      // Asegurarse de que storedAddresses sea un array válido
      let updatedAddresses = Array.isArray(storedAddresses) ? [...storedAddresses] : [];

      // Verifica si la dirección ya existe
      const addressExists = updatedAddresses.some(
        addressData => addressData.address.description === selectedAddress.description
      );

      if (addressExists) {
        // Si existe, elimina la dirección específica del array
        updatedAddresses = updatedAddresses.filter(
          addressData => addressData.address.description !== selectedAddress.description
        );
      }

      // Agregar la nueva dirección al arreglo
      const addressData = {
        address: selectedAddress,
        distance: selectedDistance,
      };
      
      console.log(__DEV__);

      updatedAddresses.push(addressData); // Agrega la nueva dirección al final del array

      // Guardar el array actualizado en AsyncStorage
      await AsyncStorage.setItem('addresses', JSON.stringify(updatedAddresses));

      // Actualizar el estado local con el array actualizado
      setStoredAddresses(updatedAddresses);

    } catch (error) {
      console.error('Error al guardar dirección:', error);
    }
  };



  // Calcular el progreso basado en la distancia
  const calculateProgress = (distance, initialDistance) => {
    const progress = ((initialDistance - distance) / initialDistance) * 100;
    return Math.min(Math.max(progress, 1), 100); // Limita el progreso entre 1 y 100
  };


  const checkProximity = (distance, initialDistance) => {

    if (distance <= initialDistance) {
      try {
        VolumeManager.setVolume(0.5);
        SoundPlayer.playAsset(require('../../assets/sounds/alarm.mp3'));
        SoundPlayer.setMixAudio(true);
        startVibrationPattern();
        console.log("Distancia alcanzada, iniciando vibración...");
        Vibration.vibrate([50, 500, 40], true);

        if (Platform.OS === 'ios') {
          Vibration.vibrate([50, 500], true);
        }

        setModalVisible(true);
        setIsModalShown(true);


        sendLocalNotification(currentLocation, distance);

      } catch (error) {
        console.log(error);
      }
    } else {
      stopVibrationPattern();
      SoundPlayer.stop();
      setModalVisible(false);
      setIsModalShown(false);
    }
  };


  const startVibrationPattern = () => {
    //if (intervalId) return;
    const pattern = [40000, 50]; // Vibrar 4s, pausar 90ms
    Vibration.vibrate(pattern, true); // True para vibración continua
  };


  useEffect(() => {
    // Cargar el estado cuando se inicia la app
    loadStateFromStorage();
  }, []);

  // Guarda el estado cuando se actualizan los valores
  useEffect(() => {
    saveStateToStorage();
  }, [selectedAddress, selectedDistance, isAlarmActive, currentLocation]);



  const handleClearInput = () => {
    //setDireccion('');
    setSelectedAddress(null); // Opcional, si también quieres limpiar la selección de la dirección
  };

  // Asegúrate de limpiar el intervalo cuando el componente se desmonte
  useEffect(() => {
    return () => {
      stopVibrationPattern(); // Limpia el intervalo al desmontar el componente
    };
  }, []);


  const getDistance = (start, end) => {
    const toRad = (Value) => (Value * Math.PI) / 180;
    const lat1 = start.latitude;
    const lon1 = start.longitude;
    const lat2 = end.latitude;
    const lon2 = end.longitude;

    const R = 6371; // Radius of the earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Distance in meters
    return distance;
  };

  let contador = 0;

  // Función para enviar notificación local
  const sendLocalNotification = (currentLocation, distance) => {
    console.log(currentLocation, distance, 'distancia');
    contador = contador + 1;

    notifee.requestPermission()
    const channelId = notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      lights: true,
      importance: AndroidImportance.HIGH,
      vibrate: true,
      //vibrationPattern: [0, 4000, 50]
    });


    notifee.displayNotification({
      title: Platform.OS === 'android' ? '<p style="color: #4caf50;"><b>¡Estás cerca de tu destino!</span></p></b></p>' : '¡Estás cerca de tu destino!',
      body: `¡Estás cerca de tu destino! La distancia es de ${distance.toFixed(0)} metros.`,
      vibrate: true,

      //vibration: [0, 1000, 500], // Vibrar durante 1s y pausar 0.5s, en bucle
      android: {
        channelId: 'default',
        vibrationPattern: [4000, 50],
        importance: AndroidImportance.HIGH,
        ongoing: true,
        pressAction: {
          id: 'default', // Permite que la notificación abra la aplicación al hacer clic
        },
        actions: [
          {
            title: 'Confirmar',
            pressAction: {
              id: 'confirmar',

            },
          },
        ],
      },
      ios: {
        pressAction: {
          id: 'default', // Permite que la notificación abra la aplicación al hacer clic
        },
        actions: [
          {
            title: 'Confirmar',
            pressAction: {
              id: 'confirmar',
            },
          },
        ],
      },

    });

  };


  useEffect(() => {
    // Escucha para notificaciones en primer plano
    const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'confirmar') {
        handleStopAlarm();
        stopBackgroundTask();
        notifee.stopForegroundService();
        contadorNotificacion = 0;
        BackgroundActions.stop();
        Vibration.cancel();
        stopVibrationPattern();

        notifee.cancelNotification('progress_notification'); // Cancela la notificación

      }
      if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'pause_alarm') {
        handleStopAlarm(); // Llama a handleStopAlarm al presionar "Pausar Alarma"
        stopBackgroundTask();
        Vibration.cancel();
        notifee.stopForegroundService();
        contadorNotificacion = 0;
        BackgroundActions.stop();
        stopVibrationPattern();

        notifee.cancelNotification('default'); // Cancela la notificación

      }
    });

    // Maneja notificaciones en segundo plano
    const unsubscribeBackground = notifee.onBackgroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'confirmar') {
        handleStopAlarm();
        Vibration.cancel();
        BackgroundActions.stop();
        notifee.stopForegroundService();
        contadorNotificacion = 0;
        stopBackgroundTask();
        stopVibrationPattern();
        notifee.cancelNotification('progress_notification'); // Cancela la notificación

      }
      if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'pause_alarm') {
        handleStopAlarm(); // Llama a handleStopAlarm en segundo plano
        Vibration.cancel();
        BackgroundActions.stop();
        notifee.stopForegroundService();
        contadorNotificacion = 0;
        stopBackgroundTask();
        stopVibrationPattern();

        notifee.cancelNotification('default'); // Cancela la notificación

      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
    };
  }, []);


  // Cargar direcciones al abrir el modal
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const addresses = await AsyncStorage.getItem('addresses');
        if (addresses) {
          const parsedAddresses = JSON.parse(addresses);
          // Verifica que los datos sean un array antes de actualizar el estado
          if (Array.isArray(parsedAddresses)) {
            setStoredAddresses(parsedAddresses);
          } else {
            console.warn('Los datos de direcciones en AsyncStorage no son un array');
          }
        }
      } catch (error) {
        console.error('Error al cargar las direcciones desde AsyncStorage:', error);
      }
    };

    loadAddresses();
  }, []);



  // Configuración para el modal
  const maxModalHeight = 0.6; // 60% de la pantalla
  const minModalHeight = 0.25; // 25% de la pantalla
  const animatedModalPosition = useRef(new Animated.Value(minModalHeight)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dy) > 10,
    onPanResponderMove: (evt, gestureState) => {
      // Limita el movimiento entre el tamaño mínimo y máximo
      const newHeight = minModalHeight + gestureState.dy / 100;
      if (newHeight <= maxModalHeight && newHeight >= minModalHeight) {
        animatedModalPosition.setValue(newHeight);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      // Define el estado final del modal al soltar
      const finalHeight = gestureState.dy < 0 ? maxModalHeight : minModalHeight;
      Animated.spring(animatedModalPosition, { toValue: finalHeight, useNativeDriver: false }).start();
    },
  });


  // Cargar dirección seleccionada en el autocompletado
  const loadAddressToAutocomplete = (address, distance) => {
    setSelectedAddress(address);
    setSelectedDistance(distance);
    setDatos1(
      {
        address: address.description,
        distance: distance
      });
    setOpenModalAutocomplete(true);
  };

  let contadorNotificacion = 0;

  const displayProgressNotification = async (progress, distance) => {
    console.log(progress, distance, 'progress y distance');

    await notifee.requestPermission();

    // Crear el canal de notificación si no existe
    const channelId = await notifee.createChannel({
      id: 'progress_notification',
      name: 'Alarma de Proximidad',
      importance: AndroidImportance.HIGH,
    });

    // Actualizar la notificación
    await notifee.displayNotification({
      id: 'progress_notification', // Identificador único para actualizar la notificación existente
      title: `¡Distancia hasta tu destino final!`,
      body: Platform.OS === 'Android' ? `Restan ${distance.toFixed(0)} metros hasta tu destino` : `Te encuentras aproximadamente a ${distance.toFixed(0)} metros de tu destino.`,
      vibrate: false,
      android: {
        //asForegroundService: true, 
        onlyAlertOnce: true,
        channelId: channelId,
        //foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_SPECIAL_USE],
        progress: {
          max: 100,
          current: progress,
          indeterminate: false,
        },
        //smallIcon: 'ic_small_icon',
        ongoing: true,
        autoCancel: false, // Prevents auto-canceling
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: '<b>Pausar Alarma</b>',
            pressAction: {
              id: 'pause_alarm',
            },
          },
        ],
        style: {
          type: AndroidStyle.BIGTEXT,
          text: `Te encuentras aproximadamente a ${distance.toFixed(0)} metros de tu destino. \n\nProgreso: ${progress}% \n\nDistancia: ${distance}`,
        },
      },
      ios: {
        channelId: channelId,
        progress: {
          max: 100,
          current: progress,
          indeterminate: false,
        },
        ongoing: true,
        autoCancel: false, // Prevents auto-canceling
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Pausar Alarma',
            pressAction: {
              id: 'pause_alarm',
            },
          },
        ],
      }
    });

    contadorNotificacion++;
  };


  const radius = parseFloat(selectedDistance) || 0; // Usar 0 si no es un número válido

  const saveStateToStorage = async () => {
    try {
      await AsyncStorage.setItem('alarmState', JSON.stringify({
        selectedAddress,
        selectedDistance,
        isAlarmActive,
        currentLocation,
        isModalShown,
      }));
    } catch (error) {
      console.error('Error saving data to storage', error);
    }
  };

  const loadStateFromStorage = async () => {
    try {
      const savedState = await AsyncStorage.getItem('alarmState');
      if (savedState) {
        const { selectedAddress, selectedDistance, isAlarmActive, currentLocation } = JSON.parse(savedState);
        setSelectedAddress(selectedAddress);
        setSelectedDistance(selectedDistance);
        setIsAlarmActive(isAlarmActive);
        setCurrentLocation(currentLocation);
        setIsModalShown(isModalShown);
      }
    } catch (error) {
      console.error('Error loading data from storage', error);
    }
  };

  const centerToCurrentLocation = () => {
    if (mapRef && currentLocation) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      });
    }
  };

  const handlePress = () => {
    Keyboard.dismiss(); // Ocultar el teclado
    isAlarmActive ? handleStopAlarm() : activateAlarm();
  };

  const inputRef = React.useRef();


  const handleCopyEmail = () => {
    Clipboard.setString('briansaban@gmail.com');  // Copia al portapapeles
    Toast.show({
      type: 'success',
      text1: '¡Exito!',
      text2: '¡El email se ha copiado! 👋',
      visibilityTime: 2500,
    });
  };

  const showToast = () => {
    Toast.show({
      type: 'success',
      text1: 'Hello',
      text2: 'This is some something 👋'
    });
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Ajusta el comportamiento para iOS y Android
      >
        <View style={styles.container}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <LottieView
                source={require("../../assets/loading.json")}
                style={{ width: "105%", height: "30%" }}
                autoPlay
                loop
              />
              <Text style={styles.loadingText}>Cargando...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <LottieView
                source={require("../../assets/error.json")}
                style={{ width: "105%", height: "30%" }}
                autoPlay
                loop
              />
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  Platform.OS === 'android'
                    ? checkAndRequestLocationPermission()
                    : checkAndRequestLocationPermissionIOS();
                }}
              >
                <Text style={styles.retryButtonText}>Intentar nuevamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.container}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                //followsUserLocation={true}
                //  showsUserLocation={true}
                region={{
                  latitude: currentLocation?.latitude,
                  longitude: currentLocation?.longitude,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.0121,
                }}>
                {currentLocation && (
                  <Marker coordinate={currentLocation} title="Tu ubicación actual">
                    <View style={{ width: 35, height: 35, alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={require('../../assets/hombre.png')} style={{ width: 35, height: 35, resizeMode: 'contain' }} />
                    </View>
                  </Marker>
                )}

                {selectedAddress && (
                  <>
                    <Marker
                      coordinate={{
                        latitude: selectedAddress.latitude,
                        longitude: selectedAddress.longitude,
                      }}
                      title={selectedAddress.description}
                      pinColor="red"
                    />
                    <Polyline
                      coordinates={[
                        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
                        { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }
                      ]}
                      strokeColor="blue"
                      strokeWidth={2}
                    />
                    <Circle
                      center={{
                        latitude: selectedAddress.latitude,
                        longitude: selectedAddress.longitude,
                      }}
                      radius={radius} // Asegurarse de que el radio no sea NaN                  strokeWidth={1}
                      strokeColor="rgba(0,112,255,0.5)"
                      fillColor="rgba(0,112,255,0.3)"
                    />
                  </>
                )}
              </MapView>

              <View style={styles.inputContainer}>
                <WalkthroughTooltip
                  isVisible={isTutorialVisible && tooltipStep === 1}
                  showChildInTooltip={false}
                  tooltipStyle={{ marginTop: Platform.OS === 'android' ? -25 : 0, justifyContent: 'center' }}
                  content={
                    <>
                      <Text style={styles.tooltipText}>Ingresá en este campo la dirección a la que necesitás dirigirte</Text>
                      <Button
                        style={styles.tooltipButton}
                        title="Siguiente"
                        onPress={() => setTooltipStep(2)}  // Maneja el avance al siguiente paso
                      />
                    </>
                  }
                  placement="bottom"
                  onClose={() => setTooltipStep(2)}
                  style={styles.tooltip}
                //tooltipStyle={styles.tooltipHighlight}
                >

                  <GooglePlacesAutocomplete
                    fetchDetails={true}
                    placeholder="Ingresar dirección"

                    textInputProps={{
                      value: undefined,
                      defaultValue: selectedAddress ? selectedAddress.description : '', // Mostrar la dirección seleccionada
                      onChangeText: (text) => {
                        setDireccion(text)
                      },
                      onBlur: () => setIsFocused(false), // Cuando se pierde el foco
                      onFocus: () => setIsFocused(true),  // Cuando el campo recibe foco
                      editable: !isAlarmActive // Bloquear edición si la alarma está activa

                    }}
                    onPress={(data, details = null) => {
                      if (details) {
                        handleSelectAddress(data, details);
                        setDireccion(data.description)
                      }
                    }}
                    query={{
                      key: 'AIzaSyArvvnFtti11jh_qdmuVKQCIDet2UBuByc', // Reemplaza con tu clave de API
                      language: 'es',
                    }}
                    styles={{
                      textInputContainer: {
                        backgroundColor: 'transparent',
                      },
                      textInput: {
                        height: 50,
                        borderColor: 'gray',
                        borderWidth: 1,
                        borderRadius: 10,
                        fontSize: 16,
                        paddingLeft: 15,
                        paddingRight: 45, // Agrega espacio para el botón derecho
                        textAlign: 'left',

                      },
                    }}
                    renderRightButton={() =>
                      direccion ? (
                        <TouchableOpacity onPress={handleClearInput} style={{ position: 'absolute', right: 15, top: 12 }}>
                          <Image
                            source={require('../../assets/icons8-close-24.png')}
                            style={[
                              {
                                resizeMode: 'contain',
                                width: 17,
                                height: 25,
                                marginTop: -0,
                                alignContent: 'center',
                                alignSelf: 'center',
                                justifyContent: 'center'
                              },
                            ]}
                          />
                        </TouchableOpacity>
                      ) : null
                    }
                    enablePoweredByContainer={false}
                    listViewDisplayed={isFocused && !isAlarmActive} // Mostrar lista solo si no está en ejecución
                    disabled={isAlarmActive} // Bloquear componente si la alarma está activa
                  />
                </WalkthroughTooltip>
                <WalkthroughTooltip
                  isVisible={isTutorialVisible && tooltipStep === 2}
                  showChildInTooltip={false}
                  tooltipStyle={{ marginTop: Platform.OS === 'android' ? -25 : 0, justifyContent: 'center' }}
                  content={
                    <>
                      <Text>Colocá la distancia en Metros desde la dirección ingresada, a partir de la cual se creará una circunferencia para activar la alarma.</Text>
                      <Button
                        style={styles.tooltipButton}
                        title="Siguiente"
                        onPress={() => setTooltipStep(3)}  // Maneja el avance al siguiente paso
                      />
                    </>
                  }
                  placement="bottom"
                  onClose={() => setTooltipStep(3)}
                  style={styles.tooltip}
                >

                  <View style={[styles.distanceInputContainer, { flexDirection: 'row', alignItems: 'center' }]}>
                    <TextInput
                      style={[styles.distanceInput, { flex: 1 }]}
                      placeholder="Ingresar distancia"
                      value={selectedDistance ? selectedDistance : ''}
                      keyboardType="numeric"
                      onChangeText={(value) => {
                        // Actualiza selectedDistance, permitiendo campo vacío
                        if (!isAlarmActive) setSelectedDistance(value);
                      }}
                      editable={!isAlarmActive}
                    />
                    <Text style={styles.unitText}>| Metros</Text>

                  </View>

                </WalkthroughTooltip>

                <WalkthroughTooltip
                  isVisible={isTutorialVisible && tooltipStep === 3}
                  showChildInTooltip={false}
                  tooltipStyle={{ marginTop: Platform.OS === 'android' ? -25 : 0, justifyContent: 'center' }}
                  content={
                    <>
                      <Text>Al activar la alarma, se iniciará la localización de tu ubicación. Cuando ingreses en el rango establecido, la alarma comenzará a sonar para notificarte que estás dentro del área.</Text>
                      <Button
                        style={styles.tooltipButton}
                        title="Finalizar"
                        onPress={() => handleCloseTutorial()}  // Maneja el avance al siguiente paso
                      />
                    </>
                  }
                  placement="bottom"
                  onClose={() => handleCloseTutorial()}
                  style={styles.tooltip}
                >
                  <TouchableOpacity
                    style={[
                      styles.button,
                      { backgroundColor: isAlarmActive ? '#D5004A' : '#223E6D' } // Color dinámico
                    ]}
                    onPress={handlePress}
                  >
                    <Text style={styles.buttonText}>
                      {isAlarmActive ? "Desactivar Alarma" : "Activar Alarma"}
                    </Text>
                  </TouchableOpacity>
                </WalkthroughTooltip>

                <Text style={{ marginTop: 20, backgroundColor: 'white', padding: 10, display: 'none' }}>Latitude:{currentLocation.latitude}, Longitude: {currentLocation.longitude}</Text>
                <Text style={{ marginTop: 20, backgroundColor: 'white', padding: 10, display: 'none' }}>Distancia:{datos.distance}, Inicial: {datos.initialDistance}, Progreso: {datos.progress}</Text>

                <TouchableOpacity style={styles.helpButton} onPress={toggleHelpModal}>
                  <Text style={styles.helpButtonText}>Ayuda</Text>
                  <Image
                    source={require('../../assets/ayuda.png')}
                    style={styles.helpIcon}
                  />
                </TouchableOpacity>
              </View>

              <Modal
                visible={isHelpModalVisible}
                transparent
                animationType="slide"
                onRequestClose={toggleHelpModal}
              >
                <View style={styles.modalBackground2}>
                  <View style={styles.modalContainer3}>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={toggleHelpModal}
                    >
                      <Image source={require('../../assets/icons8-close-24.png')} style={styles.closeIcon} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle2}>Más Información</Text>
                    <Text style={styles.modalText3}>Hecho con ❤️ por Brian Saban</Text>
                    <Text style={styles.modalText3}>
                      Si encontrás algún error o tenés alguna sugerencia para mejorar la aplicación, te podés contactar por mail a:
                      <TouchableOpacity
                        onPress={() => Linking.openURL('mailto:briansaban@gmail.com')}
                        onLongPress={handleCopyEmail}  // Manejamos el largo presionado
                      >
                        <Text style={styles.emailLink}>
                          briansaban@gmail.com
                        </Text>
                      </TouchableOpacity>
                    </Text>
                    <TouchableOpacity style={styles.retryButton2} onPress={() => Linking.openURL('https://cafecito.app/despertateya')}>
                      <Text style={styles.retryButtonText1}>Hacer un Aporte</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Toast />

              </Modal>



              <Modal
                visible={openModalAutocomplete}
                transparent
                animationType="slide"
                onRequestClose={() => setOpenModalAutocomplete(false)}
              >
                <View style={styles.modalBackground2}>
                  <View style={styles.modalContainer3}>

                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setOpenModalAutocomplete(false)}
                    >
                      <Image source={require('../../assets/icons8-close-24.png')} style={styles.closeIcon} />
                    </TouchableOpacity>

                    <Text style={styles.modalTitle2}>¿Activar la Alarma ahora?</Text>
                    <Text style={styles.modalTextDir}>
                      <Text style={styles.modalTextDirTitulo}>Dirección:</Text> {datos1.address}
                    </Text>
                    <Text style={styles.modalTextDir}>
                      <Text style={styles.modalTextDirTitulo}>Distancia:</Text> {datos1.distance} Mtrs
                    </Text>

                    <TouchableOpacity
                      style={styles.retryButtonDir}
                      onPress={() => {
                        activateAlarm(); // Activar la alarma
                        setOpenModalAutocomplete(false); // Cerrar el modal
                      }}
                    >
                      <Text style={styles.retryButtonText1}>Activar Alarma</Text>
                    </TouchableOpacity>

                  </View>
                </View>
                <Toast />

              </Modal>


              <Modal
                visible={modalVisibleError}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisibleError(false)}
              >
                <View style={styles.modalBackground1}>
                  <View style={styles.modalContainer1}>
                    <Text style={styles.modalText1}>Ups! Faltan Datos</Text>
                    <LottieView
                      source={require("../../assets/error.json")}
                      style={{ width: "90%", height: "50%" }}
                      autoPlay
                      loop
                    />
                    <Text style={styles.modalText2}>Por favor ingresá correctamente la dirección y la distancia en metros</Text>
                    <TouchableOpacity style={styles.retryButton1} onPress={() => setModalVisibleError(false)}>
                      <Text style={styles.retryButtonText1}>ACEPTAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>


              <TouchableOpacity style={styles.centerButton} onPress={centerToCurrentLocation}>
                <Image source={require('../../assets/iconCenter.png')} style={styles.centerButtonIcon} />
              </TouchableOpacity>


              {/* Modal deslizable con historial de direcciones */}
              <Animated.View style={[styles.bottomModal, {
                height: animatedModalPosition.interpolate({
                  inputRange: [0, 1],
                  outputRange: storedAddresses.length === 0 ? ['3%', '30%'] :
                    storedAddresses.length === 1
                      ? ['15%', '30%'] // Altura de 15% para un solo elemento
                      : storedAddresses.length === 2
                        ? ['23%', '40%'] // Altura de 25% para dos elementos
                        : ['27%', '60%'] // Altura de hasta 60% para tres o más elementos
                })
              }]} {...panResponder.panHandlers}>


                <View style={styles.dragIndicator} />
                <Text style={styles.modalTitle}>Historial de Direcciones</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {storedAddresses.length > 0 ? (
                    storedAddresses.slice().reverse().map((addressData, index) => (
                      <View key={index} style={styles.addressContainer}>
                        <Image source={require('../../assets/direccion.png')} style={styles.icon} />
                        <TouchableOpacity style={styles.addressButton} onPress={() => loadAddressToAutocomplete(addressData.address, addressData.distance)}>
                          <Text style={styles.addressText}>{addressData.address.description} | {addressData.distance} Mtrs</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteAddress(addressData)}>
                          <Image source={require('../../assets/basura.png')} style={styles.deleteIcon} />
                        </TouchableOpacity>
                      </View>
                    ))

                  ) : (
                    <Text style={styles.emptyMessage}>No hay ningún elemento guardado</Text>
                  )}
                </ScrollView>
              </Animated.View>


              {isAlarmActive && (
                <>
                  {/* Modal */}
                  <Modal
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                    transparent={true}
                    animationType="slide"
                  >
                    <View style={styles.modalContainer}>
                      <View style={styles.modalContent}>
                        <Text style={styles.modalText}>¿Ya te despertaste?</Text>
                        <TouchableOpacity style={styles.confirmButton} onPress={handleStopAlarm}>
                          <Text style={styles.buttonText}>Confirmar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>

                </>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback >
  );
}

export default AlarmaScreen;

const styles = StyleSheet.create({
  container1: {
    flex: 1,

  },
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  inputContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 70,
    width: '90%',
  },
  distanceInput: {
    height: '100%',
    fontSize: 16,
    padding: 5,
    backgroundColor: '#fff',
  },
  button: {
    height: 50, // Ajusta la altura del botón
    width: '100%', // Ajusta el ancho del botón
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25, // Borde redondeado
    marginTop: 20, // Margen para separar el botón
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo oscuro semitransparente
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white', // Fondo blanco del modal
    borderRadius: 10, // Bordes redondeados para el modal
    alignItems: 'center',
  },
  modalText: {
    fontSize: 20, // Texto más grande
    fontWeight: 'bold',
    marginBottom: 20, // Espacio debajo del texto
  },
  confirmButton: {
    backgroundColor: '#223E6D', // Color del botón
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10, // Bordes redondeados suaves para el botón
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activateButton: {
    marginTop: 20,
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  bottomModal: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'black',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalTitle2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    width: '100%',
    justifyContent: 'space-between',
  },
  icon: {
    width: 50,
    height: 50,
    marginRight: 5,
  },
  deleteIcon: {
    width: 25,
    height: 25,
    marginLeft: 10,
  },
  addressButton: {
    flex: 1,
    marginLeft: 10,
  },
  addressText: {
    fontSize: 16,
  },
  emptyMessage: {
    textAlign: 'center',
    color: 'gray', // O el color que prefieras
    marginTop: 20, // Espaciado superior
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  lottieAnimation: {
    width: '45%',
    height: '180%',
  },
  loadingText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#223E6D',
    marginTop: 10, // Adds some space between the animation and the text
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#223E6D',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  centerButton: {
    position: 'absolute',
    bottom: 100, // Ajusta según sea necesario
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 50,
    elevation: 5, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 80
  },
  centerButtonIcon: {
    width: 20,
    height: 20,
    tintColor: '#007AFF', // Cambia el color del ícono
  },
  distanceInputContainer: {
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
    backgroundColor: '#fff',
  },
  unitText: {
    fontSize: 16,
    color: 'gray',
    marginLeft: 5,
  },



  modalBackground1: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo oscurecido
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer1: {
    width: '70%', // Ancho del modal
    height: '40%', // Alto del modal
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  modalText1: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalText2: {
    fontSize: 14,
    fontWeight: '400',
    color: '#333',
    textAlign: 'center',
    marginBottom: 25
  },
  modalText3: {
    fontSize: 14,
    fontWeight: '400',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10
  },
  modalTextDir: {
    fontSize: 15,
    fontWeight: '400',
    color: '#333',
    textAlign: 'left',
    marginBottom: 5,
    width: '90%',
    marginBottom: 5,
  },
  modalTextDirTitulo: {
    fontWeight: '600',
    fontSize: 16,
  },
  retryButton1: {
    backgroundColor: '#223E6D',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  retryButton2: {
    backgroundColor: '#223E6D',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginTop: 7,
  },
  retryButtonDir: {
    backgroundColor: '#223E6D',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginTop: 15,
  },
  retryButton3: {
    backgroundColor: '#223E6D',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginTop: 25,
  },
  retryButtonText1: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    //padding: 10, 
    //borderRadius: 8, 
  },
  tooltipText: {
    marginBottom: 10, // Añade margen entre el texto y el botón
  },
  tooltipButton: {
    width: '80%',
    marginTop: 10,
  },
  tooltipHighlight: {
    borderRadius: 12,
    padding: 25,
  },
  enlargedWrapper: {
    padding: 20,  // Aumenta el tamaño del contenedor
    backgroundColor: 'transparent',
    margin: 10,
    borderRadius: 10,  // Ajusta el redondeo
  },
  inputWrapper: {
    padding: 20, // Asegura un tamaño grande para el contenedor
    backgroundColor: 'transparent',
    borderRadius: 10,
    position: 'relative', // Necesario para el tooltip
  },
  modalBackground2: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer2: {
    width: '90%',
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalContainer3: {
    width: '85%',
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    alignItems: 'center',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',  // Permite posicionar el botón en relación con modalContainer3
    top: 10,  // Distancia desde la parte superior
    right: 10,  // Distancia desde la parte derecha
    zIndex: 1,  // Asegura que esté encima de otros elementos del modal
  },
  closeIcon: {
    width: 20,
    height: 20,
    tintColor: 'black',  // Puedes cambiar el color si lo deseas
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginRight: 10,
    backgroundColor: 'white',
    width: '23%',
    borderRadius: 10,
    padding: 5,
  },
  helpButtonText: {
    fontSize: 14,
    color: '#223E6D',
    marginRight: 5,
  },
  helpIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  emailLink: {
    color: '#223E6D', // Color para destacar el enlace
    textDecorationLine: 'underline',
    marginLeft: 3,
    fontSize: 14,
    marginBottom: 0,
    marginTop: 3,
  }
});
