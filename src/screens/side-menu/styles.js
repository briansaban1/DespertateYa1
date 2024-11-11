import { StyleSheet } from 'react-native';
import { Colors, Dimensions, DarkMode } from '../../constants';
import { useDarkMode } from '../../DarkModeContext';


const getStyles = () => {
  const { darkMode } = useDarkMode();

return StyleSheet.create({
  container: {
    backgroundColor: darkMode ? DarkMode.background : '#f6f7f9',
    flex: 1
  },
  username: {
    fontWeight: 'bold',
    fontSize: Dimensions.px28,
    color: darkMode ? DarkMode.white : Colors.darkblue,
    textTransform: 'capitalize'
  },
  card: {
    borderRadius: 10,
    borderColor: Colors.border,
    borderWidth: 1,
    flexDirection: 'row',
    margin: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop:15,
    backgroundColor: darkMode ? DarkMode.lightbackground : '#fff'
  },
  menuButton: {
    backgroundColor: darkMode ? DarkMode.lightbackground : Colors.white,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20
  },
  subLabel: {
    marginLeft: 20,
    color: darkMode ? DarkMode.white : Colors.darkblue,
    marginBottom: 20,
    fontSize: Dimensions.px17,
    fontWeight:'500'
  }
})};

export default getStyles;
