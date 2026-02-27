import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const AdminMapScreen = ({ navigation }) => {
  const [buses, setBuses] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    // Listen to all documents in 'buses' collection
    const unsubscribe = onSnapshot(
      collection(db, 'buses'),
      snapshot => {
        const busList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBuses(busList);
      },
      error => {
        console.error('Error fetching buses: ', error);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}
            style={styles.backBtn}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Live Fleet Tracking</Text>
            <Text style={styles.subtitle}>{buses.length} Active Buses</Text>
          </View>
          <View style={{ width: 50 }} />
        </View>

        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 12.907609209246655, // Default center
            longitude: 77.47634064715605,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          showsTraffic={true}
        >
          {buses.map(
            bus =>
              bus.location && (
                <Marker
                  key={bus.id}
                  coordinate={bus.location}
                  title={`Bus: ${bus.busNumber || bus.id}`}
                  description={
                    bus.etaLabel ? `${bus.etaLabel}: ${bus.eta}s` : 'Moving'
                  }
                  pinColor="blue"
                />
              ),
          )}
        </MapView>
      </View>
    </SafeAreaView>
  );
};

export default AdminMapScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1 },
  header: {
    padding: 15,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 10 },
  backText: { fontSize: 16, color: '#007bff', fontWeight: 'bold' },
  headerTitleContainer: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'gray', textAlign: 'center' },
  map: { flex: 1 },
});
