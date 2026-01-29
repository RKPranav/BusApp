import React from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapScreen from '../screens/MapScreen';

const DriverDashboard = ({ navigation, route }) => {
  const { busNumber } = route.params || {};

  const handleLogout = () => {
    Alert.alert('Logout', 'Go back to login?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: () => navigation.replace('Login'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔝 ANDROID SAFE HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Dashboard</Text>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      {/* 🚌 BUS MAP + SIMULATION */}
      <MapScreen busNumber={busNumber} />
    </SafeAreaView>
  );
};

export default DriverDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    height: 56, // Android toolbar standard
    backgroundColor: '#1e88e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    elevation: 4, // shadow for Android
  },

  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#1565c0',
    borderRadius: 6,
  },

  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
