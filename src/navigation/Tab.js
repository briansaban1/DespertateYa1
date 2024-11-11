import React from 'react';
import { Image, View, Text, StyleSheet, PixelRatio } from 'react-native';
import { Colors, Images, DarkMode } from '../constants';
import { useDarkMode } from '../DarkModeContext';


const getStyles = () => {
  const { darkMode } = useDarkMode();

return StyleSheet.create({  
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
})
};

const Tab = ({ routeName, inactive }) => {
  const { darkMode } = useDarkMode();
  const styles = getStyles(); // Obtén los estilos

  const height = PixelRatio.roundToNearestPixel(15);


  return (
    <View style={styles.container}>

      {!inactive ? <Image
        source={Images.Linea}
        style={[
          {
            maxHeight: Platform.OS == 'ios' ? 15 : 15,
            resizeMode: 'center',
            width: 100,
            height: Platform.OS == 'ios' ? height : height,
            tintColor: inactive ? Colors.inactive : Colors.active,
            marginTop: Platform.OS == 'ios' ? -13 : -10,
            borderRadius: 4,
          },
        ]}
      /> : null}

      <Image
        source={Images.Tabs[routeName]}
        style={[
          {
            resizeMode: 'contain',
            width: 28,
            height: 26,
            tintColor: inactive ? (darkMode ? '#8E8E8E' : Colors.inactive) : ( darkMode ? DarkMode.white : Colors.active),
          },
        ]}
      />
      <Text
        style={{
          marginTop: 5,
          fontSize: 12,
          fontWeight: '500',
          color: inactive ? (darkMode ? '#8E8E8E' : Colors.inactive) : ( darkMode ? DarkMode.white : Colors.active),
        }}>
        {routeName}
      </Text>
    </View>
  );
};

export default Tab;
