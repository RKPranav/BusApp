import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdminDashboard = ({ navigation, route }) => {
  const adminName = route.params?.username || 'Admin';

  const logout = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Welcome, {adminName}</Text>

        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AdminMapScreen')}
          >
            <Text style={styles.cardText}>📍 Track All Buses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ManageDrivers')}
          >
            <Text style={styles.cardText}>🚌 Manage Drivers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ManageParents')}
          >
            <Text style={styles.cardText}>👨‍👩‍👧 Manage Parents</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AdminDashboard;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, padding: 20 },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop: 10,
    textAlign: 'center',
  },
  menu: { flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
    alignItems: 'center',
  },
  cardText: { fontSize: 18, fontWeight: 'bold' },
  logoutBtn: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
