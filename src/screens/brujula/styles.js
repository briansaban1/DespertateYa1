import { StyleSheet } from 'react-native';
import { Colors, Dimensions, DarkMode } from '../../constants';
import { useDarkMode } from '../../DarkModeContext';


const getStyles = () => {
  const { darkMode } = useDarkMode();


  return StyleSheet.create({
    container: {
      backgroundColor: darkMode ? DarkMode.background : Colors.background,
      flex: 1
    },
    item: {
      backgroundColor: darkMode ? DarkMode.lightbackground : Colors.white,
      marginHorizontal: 20,
      marginBottom: 10,
      borderRadius: 5,
      padding: 20,
      flexDirection: 'row',
      //alignItems:'center',
      shadowColor: 'black',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2, },
      elevation: 0,
      shadowRadius: 1,
      minHeight: 80,
    },
    platform: {
      marginTop: 5,
      fontWeight: '500',
      color: darkMode ? DarkMode.blue50 : Colors.blue400
    },
    fecha: {
      marginTop: 7,
      fontWeight: '200',
      fontSize: 12,
      alignContent: 'flex-end',
      alignSelf: 'flex-start',
      color: darkMode ? DarkMode.blue50 : Colors.blue400
    },
    image: {
      width: 12,
      height: 12,
      resizeMode: 'contain',
      margin: 12,
    },
    icon: {
      width: 15,
      height: 15,
      resizeMode: 'contain',
      margin: 12
    },
    modal: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#00000040',
    },
    modalContainer: {
      width: '70%',
      minHeight: 270,
      backgroundColor:  darkMode ? DarkMode.lightbackground : 'white',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalContainer1: {
      width: '50%',
      minHeight: 180,
      backgroundColor:  darkMode ? DarkMode.lightbackground : 'white',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title1: {
      fontSize: 20,
      fontWeight: 'bold',
      color: darkMode ? DarkMode.blue100 : Colors.blue400,
      marginBottom: 10,
      marginTop: 20,
    },
    flexContainer1: {
      alignItems: 'center',
      textAlign: 'center',
      justifyContent: 'center',
      marginTop: 0,
      marginBottom: 13,
      width: '85%'
    },
    hr: {
      width: '90%',
      height: 0.6,
      backgroundColor: darkMode ? DarkMode.blue50 : '#e3e3e3'
    },
    textModal: {
      color: darkMode ? DarkMode.blue50 : Colors.blue400, 
      width: '85%', 
      alignItems: 'center', 
      textAlign: 'center', 
      justifyContent: 'center', 
      marginBottom: 10
    },
    button1: {
      height: 45,
      borderRadius: 10,
      width: Dimensions.deviceWidth - 200,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.blue,
      marginTop: 10,
      marginBottom: 20
    },
    text1: {
      color: Colors.white,
      fontSize: Dimensions.px16,
      fontWeight: 'bold'
    },
    compassContainer: {
        width: 250,
        height: 250,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 125,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    compassImage: {
        width: 200,
        height: 200,
    },
    headingValue: {
        fontSize: 18,
        marginTop: 10,
        color: "#555",
    },
    cardinalDirection: {
        fontSize: 18,
        marginTop: 10,
        color: "#555",
    },
  })
};

export default getStyles;
