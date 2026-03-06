import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapScreen from '../screens/MapScreen';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const DriverDashboard = ({ navigation, route }) => {
  const { busNumber } = route.params || {};
  const [alertModalVisible, setAlertModalVisible] = useState(false);

  const alertOptions = [
    'Traffic Delay',
    'Bus Breakdown',
    'Emergency Stop',
    'Student Emergency',
    'Other Issue',
  ];

  const handleSendAlert = async alertType => {
    try {
      await addDoc(collection(db, 'alerts'), {
        busNumber: busNumber || 'BUS101',
        message: alertType,
        type: 'driver_alert',
        timestamp: serverTimestamp(),
      });
      setAlertModalVisible(false);
      Alert.alert('Success', `Alert sent: ${alertType}`);
    } catch (error) {
      console.error('Error sending alert:', error);
      Alert.alert('Error', 'Failed to send alert');
    }
  };

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
        <Text style={styles.headerTitle}>Driver: {busNumber}</Text>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => setAlertModalVisible(true)}
            style={[
              styles.logoutButton,
              { backgroundColor: '#d32f2f', marginRight: 10 },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>ALERT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🚌 BUS MAP + SIMULATION */}
      <MapScreen busNumber={busNumber} />

      {/* ALERT MODAL */}
      <Modal
        visible={alertModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Emergency Alert</Text>
            {alertOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.alertOptionBtn}
                onPress={() => handleSendAlert(option)}
              >
                <Text style={styles.alertOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.alertOptionBtn,
                { backgroundColor: '#757575', marginTop: 10 },
              ]}
              onPress={() => setAlertModalVisible(false)}
            >
              <Text style={[styles.alertOptionText, { color: '#fff' }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#d32f2f',
  },
  alertOptionBtn: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 5,
  },
  alertOptionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});
