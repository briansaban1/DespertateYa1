import { Linking } from '@react-navigation/native';

const prefix = 'comunidad://'; // Replace with your app's deep link prefix

const config = {
  screens: {
    HomeScreen1: 'HomeScreen1',
      MainApp: {
        screens: {
          Alarma: 'Alarma', // Maneja la pantalla de Alarma
        },
      },
  },
};

const linking = {
  prefixes: [prefix],
  config,
};

export { linking };