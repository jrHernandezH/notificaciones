import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';

export default function App() {
  const [notification, setNotification] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timer, setTimer] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const startCountdown = (minutes) => {
    setTimeRemaining(minutes * 60); // Convertir minutos   en segundos
    const countdownTimer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(countdownTimer);
          setNotification(null);
          Alert.alert('Tiempo agotado no puedes ingresar');
          return 0; // No permitas valores negativos
        } else {
          return prevTime - 1; // Reducir el tiempo restante
        }
      });
    }, 1000);
    setTimer(countdownTimer);
  };

  const requestPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status: ', authStatus);
    }
  };
  useEffect(() => {
    // Establecer un intervalo para actualizar la hora cada segundo
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => {
      if (timer) clearInterval(timer);
      clearInterval(timeInterval);
    };
  }, []);
  useEffect(() => {
    // -- permisos
    requestPermission();
    messaging()
      .getToken()
      .then((token) => {
        console.log('Token:', token);
      });
    // --

    messaging()
      .getInitialNotification()
      .then(async (remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage.notification);
          setNotification(remoteMessage.notification);
          startCountdown(0.16); // Iniciar cuenta regresiva de 15 minutos
        }
      });

    messaging().onNotificationOpenedApp(async (remoteMessage) => {
      console.log('Notification caused app to open from background state:', remoteMessage.notification);
      setNotification(remoteMessage.notification);
      startCountdown(0.16); // Iniciar cuenta regresiva de 15 minutos
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
    });

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      const title = remoteMessage.notification?.title || 'Título no encontrado';
      const body = remoteMessage.notification?.body || 'Cuerpo no encontrado';
      setNotification({ title, body });
      startCountdown(0.20); // Iniciar cuenta regresiva de 15 minutos
    });

    return () => {
      if (timer) clearInterval(timer);
      unsubscribe();
    };

  }, []);

  return (
    <View style={styles.container}>
      {notification ? (
        <View>
          <Text style={styles.digitalClock}>
            {Math.floor(timeRemaining / 60)}:{timeRemaining % 60 < 10 ? '0' : ''}{timeRemaining % 60}
          </Text>
        </View>
      ) : (
        <View>
          <Text style={styles.normalClock}>
            {currentTime}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitalClock: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  normalClock: {
    fontSize: 24,
  },
});
