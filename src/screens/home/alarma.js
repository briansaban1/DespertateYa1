import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Modal, Button, Alert, PermissionsAndroid, Text, TextInput, Vibration, TouchableOpacity, Image, AppState, NativeModules, Linking, Platform, Animated, PanResponder, AppRegistry } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Circle, Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import SoundPlayer from 'react-native-sound-player';
import 'react-native-get-random-values';
import BackgroundTimer from 'react-native-background-timer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { EventType, AndroidImportance, AndroidColor } from '@notifee/react-native';
import LottieView from "lottie-react-native";
import { VolumeManager, useRingerMode, RINGER_MODE } from 'react-native-volume-manager';


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


  useEffect(() => {
    checkAndRequestLocationPermission();
  }, []);

  const checkAndRequestLocationPermission = async () => {
    // Verifica si el permiso de ubicación ya está concedido
    const hasLocationPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    if (Platform.OS === 'android') {
      if (hasLocationPermission) {
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
    } else {
      fetchLocation();
    }
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
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setLoading(false); // Stop loading after getting the location
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

  const fetchLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setLoading(false); // Stop loading after getting the location
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


  useEffect(() => {
    if (mapRef.current && selectedAddress && currentLocation) {
      // Ajustar el mapa para que muestre ambos puntos
      mapRef.current.fitToCoordinates(
        [
          { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
          { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude },
        ],
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        }
      );
    }
  }, [selectedAddress, currentLocation]);

  const handleSelectAddress = async (data, details) => {
    const address = {
      description: data.description,
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
    };
    setSelectedAddress(address);

  };

  // Eliminar dirección del AsyncStorage
  const deleteAddress = async (addressToDelete) => {
    const updatedAddresses = storedAddresses.filter(
      (address) => address.description !== addressToDelete.description
    );
    await AsyncStorage.setItem('addresses', JSON.stringify(updatedAddresses));
    setStoredAddresses(updatedAddresses); // Actualiza el estado local
  };


  const handleStopAlarm = () => {
    notifee.cancelNotification('progress_notification'); // Cancela la notificación
    stopVibrationPattern();

    Vibration.cancel()
    BackgroundTimer.stopBackgroundTimer();

    SoundPlayer.stop(); // Detener el sonido
    setIsAlarmActive(false);
    setSelectedAddress(null);
    setModalVisible(false);
    setIsModalShown(false);
    contador = 0;
  };

  const stopVibrationPattern = () => {

    Vibration.cancel(); // Cancela cualquier vibración activa
    BackgroundTimer.stopBackgroundTimer();

    BackgroundTimer.clearInterval(null); // Detiene el intervalo
    setVibrationInterval(null); // Resetea el estado


  };

  const activateAlarm = async () => {
    if (!currentLocation || !selectedAddress || !selectedDistance) {
      setModalVisibleError(true);
      return;
    }
    // Iniciar alarma (esperando a que entres en la zona)
    setIsAlarmActive(true);
    displayProgressNotification(0, getDistance(currentLocation, selectedAddress));

    try {
      // Verifica si la dirección ya existe
      const addressExists = storedAddresses.some(address => address.description === selectedAddress.description);
      if (addressExists) {
        // Si existe, eliminar la dirección más antigua
        storedAddresses.shift(); // Elimina la dirección más antigua
      }
      // Agregar la nueva dirección al arreglo
      const updatedAddresses = [...storedAddresses, selectedAddress];
      await AsyncStorage.setItem('addresses', JSON.stringify(updatedAddresses));
      setStoredAddresses(updatedAddresses); // Actualiza el estado local
    } catch (error) {
      console.error('Error al guardar dirección:', error);
    }

  };

  // Calcular el progreso basado en la distancia
  const calculateProgress = (distance, initialDistance) => {
    const progress = ((initialDistance - distance) / initialDistance) * 100;
    return Math.min(Math.max(progress, 0), 100); // Limita el progreso entre 0 y 100
  };

  const BackgroundVibrationTask = async () => {
    BackgroundTimer.setInterval(() => {
      Vibration.vibrate([50, 500, 40], true);
    }, 100);
  };

  const checkProximity = () => {
    if (currentLocation && selectedAddress && selectedAddress.latitude && selectedAddress.longitude) {
      const distance = getDistance(
        currentLocation,
        { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }
      );
      const initialDistance = parseFloat(selectedDistance);
      const progress = calculateProgress(distance, initialDistance);

      console.log(progress, distance, 'aca');
      displayProgressNotification(progress, distance);

      if (distance <= initialDistance) {
        try {
          VolumeManager.setVolume(0.5);
          if (Platform.OS === 'ios') {
            enableInSilenceMode(true);
          }
          SoundPlayer.playAsset(require('../../assets/sounds/alarm.mp3'));
          startVibrationPattern();

          //NativeModules.BackgroundVibrationTaskService.start(); // Llama al servicio de vibración en segundo plano
          console.log("Distancia alcanzada, iniciando vibración...");

          //Vibration.vibrate([50,500,40], true);
          //const pattern = [4000, 50]; // Vibrar 4s, pausar 90ms
          Vibration.vibrate([50, 500, 40], true); // True para vibración continua

          if (contador < 1) {
            sendLocalNotification(currentLocation, distance);
            //console.log("Distancia alcanzada, iniciando vibración...");
            //startVibrationPattern();
            setModalVisible(true);
            setIsModalShown(true);
            contador++;
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        stopVibrationPattern();
        SoundPlayer.stop();
        setModalVisible(false);
        setIsModalShown(false);
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
      title: '<p style="color: #4caf50;"><b>¡Estás cerca de tu destino!</span></p></b></p>',
      body: `¡Estás cerca de tu destino! La distancia es de ${distance.toFixed(0)} metros.`,
      vibrate: true,

      //vibration: [0, 1000, 500], // Vibrar durante 1s y pausar 0.5s, en bucle
      android: {
        channelId: 'default',
        vibrationPattern: [4000, 50],
        importance: AndroidImportance.HIGH,
        ongoing: true,
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
        BackgroundTimer.stopBackgroundTimer();
        Vibration.cancel();
        stopVibrationPattern();
        notifee.cancelNotification('progress_notification'); // Cancela la notificación

      }
      if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'pause_alarm') {
        handleStopAlarm(); // Llama a handleStopAlarm al presionar "Pausar Alarma"
        Vibration.cancel();
        BackgroundTimer.stopBackgroundTimer();
        stopVibrationPattern();
        notifee.cancelNotification('default'); // Cancela la notificación

      }
    });

    // Maneja notificaciones en segundo plano
    const unsubscribeBackground = notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'confirmar') {
        handleStopAlarm();
        Vibration.cancel();
        BackgroundTimer.stopBackgroundTimer();

        stopVibrationPattern();
        notifee.cancelNotification('progress_notification'); // Cancela la notificación

      }
      if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'pause_alarm') {
        handleStopAlarm(); // Llama a handleStopAlarm en segundo plano
        Vibration.cancel();
        BackgroundTimer.stopBackgroundTimer();

        stopVibrationPattern();
        notifee.cancelNotification('default'); // Cancela la notificación

      }
    });

    return () => {
      unsubscribeForeground();
      //unsubscribeBackground(); 
    };
  }, []);


  // Cargar direcciones al abrir el modal
  useEffect(() => {
    const loadAddresses = async () => {
      const addresses = await AsyncStorage.getItem('addresses');
      if (addresses) {
        setStoredAddresses(JSON.parse(addresses));
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
  const loadAddressToAutocomplete = (address) => {
    setSelectedAddress(address);
    // Aquí podrías asignar el valor a GooglePlacesAutocomplete manualmente, si es necesario.
  };


  const displayProgressNotification = async (progress, distance, totalDistance) => {
    await notifee.requestPermission();

    // Crear el canal de notificación si no existe
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Alarma de Proximidad',
      importance: AndroidImportance.HIGH, // Asegura que la notificación sea visible
      vibrate: true,
      vibrationPattern: [4000, 50],
    });

    // Mostrar o actualizar la notificación
    await notifee.displayNotification({
      id: 'progress_notification', // Identificador único para actualizar la notificación existente
      title: `¡Distancia hasta tu destino final!`,
      body: Platform.OS === 'Android' ? `Restan ${distance.toFixed(0)} metros hasta tu destino` : `Te encuentras aproximadamente a ${distance.toFixed(0)} metros de tu destino.`,
      vibrate: true,

      android: {
        channelId,
        vibrationPattern: [4000, 50],
        progress: {
          max: 100,
          current: progress,
          indeterminate: false,
        },
        ongoing: true, // Notificación persistente

        actions: [
          {
            title: 'Pausar Alarma',
            pressAction: {
              id: 'pause_alarm',
            },
          },
        ],
      },
      ios: {
        channelId,
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
  };



  useEffect(() => {
    if (isAlarmActive) {
      console.log(isAlarmActive, 'alarma activada')

      BackgroundTimer.stopBackgroundTimer();
      const interval = BackgroundTimer.setInterval(() => {
        checkProximity();

      }, 5000); // Verifica la proximidad cada 5 segundos

      return () =>
        BackgroundTimer.clearInterval(interval);
      //clearInterval(interval);
    }
  }, [isAlarmActive]);

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

  return (
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
          <TouchableOpacity style={styles.retryButton} onPress={rebuild()}>
            <Text style={styles.retryButtonText}>Intentar nuevamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.container}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={{
              latitude: currentLocation?.latitude,
              longitude: currentLocation?.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.0121,
            }}
          >
            {currentLocation && ( 
              <Marker
                coordinate={currentLocation}
                title="Tu ubicación actual"
                image={require('../../assets/hombre.png')} // Ruta a tu icono azul personalizado
                style={{ width: 65, height: 65 }}
              />
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
            <GooglePlacesAutocomplete
              fetchDetails={true}
              placeholder="Ingresar dirección"
              textInputProps={{
                value: undefined,
                defaultValue: selectedAddress ? selectedAddress.description : '', // Mostrar la dirección seleccionada
                onChangeText: (text) => {
                  setDireccion(text)
                },

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
            />
            <View style={[styles.distanceInputContainer, { flexDirection: 'row', alignItems: 'center' }]}>

              <TextInput
                style={[styles.distanceInput, { flex: 1 }]}
                placeholder="Ingresar distancia"
                value={selectedDistance ? selectedDistance : ''}
                keyboardType="numeric"
                onChangeText={(value) => {
                  // Actualiza selectedDistance, permitiendo campo vacío
                  setSelectedDistance(value);
                }}
              />
              <Text style={styles.unitText}>| Metros</Text>

            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: isAlarmActive ? '#D5004A' : '#223E6D' } // Color dinámico
              ]}
              onPress={isAlarmActive ? handleStopAlarm : activateAlarm}
            >
              <Text style={styles.buttonText}>
                {isAlarmActive ? "Desactivar Alarma" : "Activar Alarma"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.centerButton} onPress={centerToCurrentLocation}>
            <Image source={require('../../assets/iconCenter.png')} style={styles.centerButtonIcon} />
          </TouchableOpacity>


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
            {storedAddresses.length > 0 ? (
              storedAddresses.slice().reverse().map((address, index) => (
                <View key={index} style={styles.addressContainer}>
                  <Image source={require('../../assets/direccion.png')} style={styles.icon} />
                  <TouchableOpacity style={styles.addressButton} onPress={() => loadAddressToAutocomplete(address)}>
                    <Text style={styles.addressText}>{address.description}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteAddress(address)}>
                    <Image source={require('../../assets/basura.png')} style={styles.deleteIcon} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMessage}>No hay ningún elemento guardado</Text>
            )}
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
  );
}

export default AlarmaScreen;

const styles = StyleSheet.create({
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
    top: 50,
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
  retryButton1: {
    backgroundColor: '#223E6D',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  retryButtonText1: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
