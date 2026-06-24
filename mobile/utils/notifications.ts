import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus === 'granted') {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Error requesting notification permissions:', e);
    return false;
  }
}

export async function scheduleLocalNotifications(prescriptions: any[], appointments: any[]) {
  if (Platform.OS === 'web') return;
  try {
    // Request permission first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Clear previous scheduled notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Schedule Daily Medication Reminder
    if (prescriptions && prescriptions.length > 0) {
      const medList = prescriptions.map((p) => p.medication).join(', ');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Medication Reminder 💊",
          body: `It's time to take your daily pregnancy medications: ${medList}.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          hour: 9,
          minute: 0,
          repeats: true,
        } as any,
      });
      console.log('Scheduled daily medication reminder at 9:00 AM');
    }

    // 2. Schedule Appointment Reminders
    for (const appt of appointments) {
      const apptDate = new Date(appt.date);
      // Schedule 24 hours before
      const triggerDate = new Date(apptDate.getTime() - 24 * 60 * 60 * 1000);
      if (triggerDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Antenatal Visit Reminder 📅",
            body: `Don't forget your scheduled checkup tomorrow: ${appt.purpose || 'Regular Checkup'}.`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: triggerDate as any,
        });
        console.log(`Scheduled visit reminder for ${triggerDate.toLocaleString()}`);
      }
    }
  } catch (error) {
    console.error('Failed to schedule local notifications:', error);
  }
}
