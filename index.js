import { AppRegistry, AppState, Vibration } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import NavigationService from './src/navigation/RootNavigation';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import handleStopAlarm from './src/screens/home/alarma';  // Import stop function

let notificationDisplayed = true;

const displayNotification = async (title, body) => {
    console.log(title, 'titulo1')
    try{
        await notifee.requestPermission()
        const channelId = await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
            importance: AndroidImportance.HIGH,
            vibration: false,
            sound: 'default',
            vibrationPattern: [300, 500]
        });
            await notifee.displayNotification({
                title: title,
                body: body,
                android: {
                    channelId,
                    pressAction: {
                        id: 'default',
                    },
                    importance: AndroidImportance.HIGH,
                },
            });
            notificationDisplayed = true;
        
    }catch (error){
        console.log(error);
    }
}

// Ejemplo: Llamada para mostrar notificación local
const triggerNotification = () => {
    displayLocalNotification('Alerta Local', 'Esta es una notificación local.');
};



const backgroundMessageHandler = async (remoteMessage) => {
    console.log('Received FCM background message in index.js: ', remoteMessage);
    if (remoteMessage){
        const {title, body} = remoteMessage.notification;
        await displayNotification(title, body);
        NavigationService.navigate('Alarma')
    }
}

messaging().setBackgroundMessageHandler(backgroundMessageHandler)
messaging().getInitialNotification().then(async (remoteMessage) =>{
    console.log('Received FCM background message in index1.js: ', remoteMessage);

    if (remoteMessage){
        const {title, body} = remoteMessage.notification;
        await displayNotification(title, body);
        NavigationService.navigate('Alarma')
    }
})

AppRegistry.registerComponent(appName, () => App);


notifee.onForegroundEvent(async ({type, detail})=>{
    switch(type){
        case EventType.DISMISSED:
            console.log('User dismissed notification', detail.notification);
            break;
        case EventType.PRESS:
            setTimeout(() => {
                NavigationService.navigate('Alarma')
                Vibration.cancel() 
            }, 1000)
            console.log('User pressed notification', detail.notification);
            break;
    }
})