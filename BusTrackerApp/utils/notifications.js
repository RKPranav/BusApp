import notifee, { AndroidImportance } from '@notifee/react-native';

/* 🔔 CREATE CHANNEL (ONCE) */
export async function setupNotifications() {
  // Required for iOS and Android 13+
  await notifee.requestPermission();

  await notifee.createChannel({
    id: 'bus-tracker',
    name: 'Bus Tracker Alerts',
    importance: AndroidImportance.HIGH,
  });
}

/* 🔔 NOTIFY WHEN BUS STARTS */
export async function notifyBusStarted() {
  await notifee.displayNotification({
    title: '🚍 Bus Started',
    body: 'The school bus has started its journey.',
    android: {
      channelId: 'bus-tracker',
      importance: AndroidImportance.HIGH,
    },
  });
}

/* 🔔 NOTIFY 8 SECONDS BEFORE STOP */
export async function notifyBeforeStop(stopNumber) {
  await notifee.displayNotification({
    title: 'Upcoming Bus Stop',
    body: `Bus will reach Stop ${stopNumber} in 8 seconds`,
    android: {
      channelId: 'bus-tracker',
      importance: AndroidImportance.HIGH,
    },
  });
}

/* 🔔 NOTIFY WHEN BUS IS 500m AWAY */
export async function notifyBusApproaching(stopName) {
  await notifee.displayNotification({
    title: '🚌 Bus Arriving Soon!',
    body: `Your child's school bus is approaching and is currently about 500 meters away from your stop. Please be ready.`,
    android: {
      channelId: 'bus-tracker',
      importance: AndroidImportance.HIGH,
    },
  });
}

/* 🔔 NOTIFY WHEN BUS REACHES DESTINATION */
export async function notifyBusReachedSchool() {
  await notifee.displayNotification({
    title: '🏫 Bus Reached School',
    body: 'The bus has safely reached the school.',
    android: {
      channelId: 'bus-tracker',
      importance: AndroidImportance.HIGH,
    },
  });
}
