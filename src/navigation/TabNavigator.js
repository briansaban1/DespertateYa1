import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home';
import TabBar from './TabBar';
import HomeScreen1 from '../screens/home/index2';

const Tab = createBottomTabNavigator();

function TabNavigator({route}) {
return(
    <Tab.Navigator
    initialRouteName={'Home'}
    tabBar={() => null} // This makes the tab bar invisible
    screenOptions={{
        style:{
          height: Platform.OS == 'android' ? 60 : 80,
          paddingBottom: Platform.OS == 'ios' ? 17 : 0,
          alignItems: 'center',
          justifyContent: 'flex-start',
          flex: 1,
          borderTopColor:'#fff',  
        }
        
    }}

    backBehavior={'Home'}>
        <Tab.Screen name='Home' options={{headerShown: false}} component={HomeScreen} />
        <Tab.Screen name='Home1' options={{headerShown: false}} component={HomeScreen1} />
        <Tab.Screen name='Home2' options={{headerShown: false}} component={HomeScreen} />
        <Tab.Screen name='Home3' options={{headerShown: false}} component={HomeScreen} />
    </Tab.Navigator>
);
};
export default TabNavigator