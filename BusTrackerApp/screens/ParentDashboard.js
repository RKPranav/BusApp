import React from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapScreen from '../screens/MapScreen';

const ParentDashboard = ({ navigation, route }) => {
  const { busNumber, stop, studentName } = route.params || {};

  const handleLogout = () => {
    Alert.alert('Logout', 'Go back to login?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: () => navigation.replace('Login') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parent: {studentName}</Text>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: '#FFA500', marginRight: 10 },
            ]}
            onPress={() => navigation.navigate('Chat')}
          >
            <Text style={styles.logoutText}>CHAT</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* READ-ONLY BUS TRACKING */}
      <MapScreen busNumber={busNumber} parentStop={stop} readOnly />
    </SafeAreaView>
  );
};

export default ParentDashboard;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    height: 56,
    backgroundColor: '#43a047',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    elevation: 4,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  logoutButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },

  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
