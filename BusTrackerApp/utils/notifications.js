import notifee, { AndroidImportance } from '@notifee/react-native';

/* 🔔 CREATE CHANNEL (ONCE) */
export async function setupNotifications() {
  await notifee.createChannel({
    id: 'bus-tracker',
    name: 'Bus Tracker Alerts',
    importance: AndroidImportance.HIGH,
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
