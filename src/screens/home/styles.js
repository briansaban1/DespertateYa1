import { Platform, StyleSheet } from 'react-native';
import { Colors, Dimensions, DarkMode } from '../../constants';
import { useDarkMode } from '../../DarkModeContext';



const getStyles = () => {
    const { darkMode } = useDarkMode();
    const right = false;
    const left = true;


    return StyleSheet.create({

        item: {
            marginVertical: 8,
        },
        appName: {
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 10,
            color: "#333",
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
        container: {
            backgroundColor: darkMode ? DarkMode.background : '#ebeff3',
            flex: 1,
        },
        scrollContent: {
            flex: 1,
        },
        topContainer: {
            backgroundColor: darkMode ? DarkMode.lightbackground : Colors.lightbackground,
        },
        headerIcon: {
            width: 27,
            height: 27,
            resizeMode: 'contain',
        },
        username: {
            fontWeight: '400',
            fontSize: Dimensions.px15,
            color: darkMode ? DarkMode.white : Colors.darkblue,
            textTransform: 'capitalize'
        },
        hello: {
            fontWeight: 'bold',
            fontSize: Dimensions.px15,
            color: darkMode ? DarkMode.white : Colors.darkblue,
            marginVertical: 10,
            marginLeft: 5
        },
        welcome: {
            fontSize: Dimensions.px17,
            marginLeft: 30
        },
        welcome_title: {
            fontSize: Dimensions.px23,
            marginLeft: 20,
            color: darkMode ? DarkMode.white : Colors.darkblue,
            fontWeight: '600'
        },
        novedades_title: {
            fontSize: Dimensions.px20,
            marginLeft: 20,
            color: darkMode ? DarkMode.white : Colors.darkblue,
            fontWeight: '500'
        },
        tabIcon: {
            width: 27,
            height: 27,
            resizeMode: 'contain',

        },
        tab: {
            flex: 1,
            backgroundColor: darkMode ? DarkMode.lightbackground : '#E7EAF5',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 15,
        },
        bottomBlock: {
            width: '47%',
            height: 140,
            marginBottom: 10,
            borderRadius: 10,
            padding: 10,
            backgroundColor: darkMode ? DarkMode.lightbackground : Colors.white,
        },
        bottomBlockLarge: {
            width: '100%',
            height: 130,
            marginBottom: 10,
            borderRadius: 10,
            padding: 10,
            backgroundColor: darkMode ? DarkMode.blue50 : Colors.darkblue,
        },
        bottomBlockHr: {
            height: 7,
            width: '100%',
            backgroundColor: '#E2E2E2',
            borderRadius: 4,
            marginVertical: 8
        },
        bottomSubBlockHr: {
            height: 7,
            width: '100%',
            backgroundColor: darkMode ? DarkMode.blue300 : Colors.blue300,
            borderRadius: 4,
        },
        refreshControlColors: darkMode ? [DarkMode.blue50] : [Colors.black],
        refreshControlColorsIOS: darkMode ? DarkMode.white : Colors.black,
        refreshControlBackgroundColor: darkMode ? DarkMode.background : Colors.background,
        refreshControlContainer: {
            paddingVertical: 50, // Ajusta este valor según sea necesario
        },
        loadMoreText: {
            color: darkMode ? DarkMode.blue50 : Colors.blue400,
            fontWeight: '500',
            fontSize: Dimensions.px15,
            marginTop: 7,
            marginLeft: 20,
            marginRight: 20
        },
        flexBetweenWrapper:{
            width: '100%',
            marginTop: Platform.OS == 'android' ? 35 : 8,
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 0,
            flexDirection: 'row',
        }

    })
};

export default getStyles;
