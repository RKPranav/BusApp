import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import CheckBox from '@react-native-community/checkbox';
import { setupNotifications, notifyBeforeStop } from '../utils/notifications';
import { db } from '../config/firebase';
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';

/* FIXED ROUTE */
const START_POINT = {
  latitude: 12.907609209246655,
  longitude: 77.47634064715605,
};
const END_POINT = { latitude: 12.86377436214521, longitude: 77.43479290230692 };

const MOVE_INTERVAL_MS = 1000;

const MapScreen = ({ busNumber, parentStop, readOnly = false }) => {
  const mapRef = useRef(null);
  const fullRouteRef = useRef([]); // Store full route for slicing

  // Helper to calculate bearing between two points
  const getBearing = (startLat, startLng, destLat, destLng) => {
    const startLatRad = (startLat * Math.PI) / 180;
    const startLngRad = (startLng * Math.PI) / 180;
    const destLatRad = (destLat * Math.PI) / 180;
    const destLngRad = (destLng * Math.PI) / 180;

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x =
      Math.cos(startLatRad) * Math.sin(destLatRad) -
      Math.sin(startLatRad) *
        Math.cos(destLatRad) *
        Math.cos(destLngRad - startLngRad);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  };

  const [route, setRoute] = useState([]);
  const [routeStops, setRouteStops] = useState([]);
  const [busPosition, setBusPosition] = useState(START_POINT);

  const [pausedRoute, setPausedRoute] = useState(null);
  const [pausedStopIndices, setPausedStopIndices] = useState(null);
  const [nextStopNumber, setNextStopNumber] = useState(null);

  const [showAttendance, setShowAttendance] = useState(false);
  const [currentStop, setCurrentStop] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);

  const [etaSeconds, setEtaSeconds] = useState(0);
  const [etaLabel, setEtaLabel] = useState('ETA');
  const [statusText, setStatusText] = useState('Idle');
  const [busStarted, setBusStarted] = useState(false);

  // New States for Error Handling
  const [connectionStatus, setConnectionStatus] = useState('Init...');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setupNotifications();
  }, []);

  /* STUDENTS */
  const studentsByStop = {
    1: [
      { id: 1, name: 'Arjun', present: false },
      { id: 2, name: 'Kiran', present: false },
      { id: 3, name: 'Rohit', present: false },
      { id: 4, name: 'Sneha', present: false },
    ],
    2: [
      { id: 5, name: 'Meera', present: false },
      { id: 6, name: 'Ananya', present: false },
      { id: 7, name: 'Vikram', present: false },
      { id: 8, name: 'Pooja', present: false },
    ],
    3: [
      { id: 9, name: 'Rahul', present: false },
      { id: 10, name: 'Nisha', present: false },
      { id: 11, name: 'Amit', present: false },
      { id: 12, name: 'Divya', present: false },
    ],
  };

  const calculateEtaToDestination = (currentIndex, totalLength) =>
    Math.max(
      0,
      Math.ceil(((totalLength - currentIndex) * MOVE_INTERVAL_MS) / 1000),
    );

  const calculateEtaToNextStop = (currentIndex, nextStopIndex) =>
    Math.max(
      0,
      Math.ceil(((nextStopIndex - currentIndex) * MOVE_INTERVAL_MS) / 1000),
    );

  /* ROUTE UTILS */
  const getRouteFromOSRM = async () => {
    const url = `https://router.project-osrm.org/route/v1/driving/${START_POINT.longitude},${START_POINT.latitude};${END_POINT.longitude},${END_POINT.latitude}?overview=full&geometries=geojson`;
    try {
      const res = await fetch(url);
      const json = await res.json();

      if (!json.routes || json.routes.length === 0) {
        throw new Error('No route found');
      }

      const coords = json.routes[0].geometry.coordinates.map(c => ({
        latitude: c[1],
        longitude: c[0],
      }));

      const stopIndices = [
        Math.floor(coords.length * 0.25),
        Math.floor(coords.length * 0.5),
        Math.floor(coords.length * 0.75),
      ];

      return { coords, stopIndices };
    } catch (error) {
      console.error('Error fetching route:', error);
      throw error;
    }
  };

  /* TRACKING LOGIC */
  useEffect(() => {
    let unsubscribe;

    // Only fetch route and start listener if readOnly (Parent)
    if (readOnly) {
      setConnectionStatus('Connecting...');
      // 1. Fetch Route for visualization
      getRouteFromOSRM()
        .then(({ coords, stopIndices }) => {
          setRoute(coords);
          fullRouteRef.current = coords; // Store full copy
          setRouteStops(stopIndices.map(i => coords[i]));
        })
        .catch(() => {
          console.log('Failed to fetch route for parent view');
        });

      // 2. Listen for bus location via Firestore
      const busDocRef = doc(db, 'buses', busNumber || 'BUS101');
      unsubscribe = onSnapshot(
        busDocRef,
        docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setConnectionStatus('Online');

            if (data.location) {
              setBusPosition(data.location);
              setStatusText(
                data.nextStop ? `Next Stop: ${data.nextStop}` : 'Bus Moving',
              );
              if (data.eta !== undefined) setEtaSeconds(data.eta);
              if (data.etaLabel) setEtaLabel(data.etaLabel);

              // Update Route Slicing for Parent
              if (
                data.routeIndex !== undefined &&
                fullRouteRef.current.length > 0
              ) {
                setRoute(fullRouteRef.current.slice(data.routeIndex));
              }

              mapRef.current?.animateCamera({
                center: data.location,
                zoom: 17,
                heading: data.heading || 0,
                pitch: 0, // Keep 2D for parents usually, or changable
              });
            }
          } else {
            setConnectionStatus('Waiting for Bus...');
            setStatusText('Bus Not Started');
          }
        },
        error => {
          console.error('Firestore error:', error);
          setConnectionStatus('Connection Error');
        },
      );
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [readOnly, busNumber]);

  const handleShowRoute = async () => {
    if (readOnly) return;

    setBusStarted(false);
    setStatusText('Starting...');
    setEtaLabel('Calculating...');

    try {
      const { coords, stopIndices } = await getRouteFromOSRM();

      setRoute(coords);
      fullRouteRef.current = coords; // Store full copy
      setRouteStops(stopIndices.map(i => coords[i]));
      setBusPosition(coords[0]);

      startBusAnimation(coords, stopIndices, 1);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to fetch start route. check internet connection.',
      );
      setStatusText('Error');
    }
  };

  const startBusAnimation = (coords, stopIndices, stopNumber) => {
    let index = 0;
    let hasNotified = false;

    if (!busStarted) {
      Alert.alert('Bus Started', 'The bus has started 🚍');
      setBusStarted(true);
      // Initialize Bus Doc
      setDoc(
        doc(db, 'buses', busNumber || 'BUS101'),
        {
          startedAt: serverTimestamp(),
          status: 'active',
          busNumber: busNumber || 'BUS101',
        },
        { merge: true },
      );
    }

    setStatusText(`Moving to Stop ${stopNumber}`);

    const interval = setInterval(() => {
      if (index >= coords.length - 1) {
        clearInterval(interval);
        setStatusText('Reached Destination');
        setEtaSeconds(0);
        return;
      }

      const pos = coords[index];
      setBusPosition(pos);
      setRoute(coords.slice(index)); // Hide traversed path

      // Calculate Heading
      let heading = 0;
      if (index < coords.length - 1) {
        const nextPos = coords[index + 1];
        heading = getBearing(
          pos.latitude,
          pos.longitude,
          nextPos.latitude,
          nextPos.longitude,
        );
      }

      mapRef.current?.animateCamera({
        center: pos,
        zoom: 18,
        pitch: 60, // Tilted view for navigation feel
        heading: heading,
      });

      // Calculate ETA BEFORE sending
      let eta = 0;
      let currentEtaLabel = '';
      if (stopIndices.length > 0) {
        eta = calculateEtaToNextStop(index, stopIndices[0]);
        currentEtaLabel = `ETA to Stop ${stopNumber}`;
      } else {
        eta = calculateEtaToDestination(index, coords.length);
        currentEtaLabel = 'ETA to Destination';
      }

      setEtaSeconds(eta);
      setEtaLabel(currentEtaLabel);

      // SYNC: Update Firestore
      updateDoc(doc(db, 'buses', busNumber || 'BUS101'), {
        location: pos,
        routeIndex: index, // Send current index
        heading: heading, // Send heading for visualization
        nextStop: stopNumber,
        eta: eta,
        etaLabel: currentEtaLabel,
        lastUpdated: serverTimestamp(),
      }).catch(err => console.log('Sync error', err));

      if (eta <= 8 && !hasNotified) {
        notifyBeforeStop(stopNumber);
        hasNotified = true;
      }

      if (stopIndices.length > 0 && index === stopIndices[0]) {
        clearInterval(interval);

        setStatusText(`Halted at Stop ${stopNumber}`);
        setPausedRoute(coords.slice(index + 1));
        setPausedStopIndices(stopIndices.slice(1).map(i => i - index - 1));
        setNextStopNumber(stopNumber + 1);

        setCurrentStop(stopNumber);
        setAttendanceList(studentsByStop[stopNumber] || []);
        setShowAttendance(true);
        return;
      }

      index++;
    }, MOVE_INTERVAL_MS);
  };

  const handleSubmitAttendance = async () => {
    // 1. Save Attendance to Firestore
    try {
      await addDoc(collection(db, 'attendance'), {
        busNumber: busNumber || 'BUS101',
        stopNumber: currentStop,
        students: attendanceList,
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0],
      });

      Alert.alert('Attendance Saved', 'Bus will continue');

      // 2. Send Notifications (Simulated via Firestore or just Local)
      // Here we just log it or add to a notifications collection
      attendanceList.forEach(s => {
        if (s.present) {
          addDoc(collection(db, 'notifications'), {
            busNumber: busNumber || 'BUS101',
            studentName: s.name,
            message: `${s.name} has boarded the bus at Stop ${currentStop}`,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      });
    } catch (e) {
      console.error('Error saving attendance', e);
      Alert.alert('Error', 'Failed to save attendance');
    }

    setShowAttendance(false);
    setAttendanceList([]);
    setStatusText('Running');

    if (pausedRoute) {
      startBusAnimation(pausedRoute, pausedStopIndices, nextStopNumber);
    }

    setPausedRoute(null);
    setPausedStopIndices(null);
    setNextStopNumber(null);
  };

  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#e0e0e0',
      }}
    >
      <View style={styles.topBox}>
        <Text style={styles.statusText}>Status: {statusText}</Text>
        <Text style={styles.etaText}>
          {etaLabel}: {etaSeconds} sec
        </Text>
        {readOnly && (
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 12,
                color: connectionStatus === 'Online' ? 'green' : 'red',
                marginTop: 4,
              }}
            >
              Network: {connectionStatus}
            </Text>
            <Text style={{ fontSize: 10, color: '#aaa' }}>
              Debug: Bus={busNumber} | ReadOnly={readOnly ? 'Yes' : 'No'}
            </Text>
          </View>
        )}
        {!readOnly && (
          <Button title="Start Journey" onPress={handleShowRoute} />
        )}
      </View>

      <MapView
        ref={mapRef}
        style={{ flex: 1, width: '100%', height: '100%' }}
        provider={PROVIDER_GOOGLE}
        mapType="standard"
        initialRegion={{
          latitude: START_POINT.latitude,
          longitude: START_POINT.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onMapReady={() => setMapReady(true)}
        showsTraffic={true}
      >
        {route.length > 0 && (
          <Polyline coordinates={route} strokeColor="blue" strokeWidth={5} />
        )}

        {/* STOPS WITH COLOR */}
        {Array.isArray(routeStops) &&
          routeStops.map((stop, i) => {
            let pinColor = 'orange';
            if (currentStop === i + 1) pinColor = 'green';
            else if (currentStop > i + 1) pinColor = 'gray';

            return (
              <Marker
                key={i}
                coordinate={stop}
                title={`Stop ${i + 1}`}
                pinColor={pinColor}
              />
            );
          })}

        {/* BUS ICON */}
        {busPosition && (
          <Marker
            coordinate={busPosition}
            image={require('../assets/icons/bus.png')}
            anchor={{ x: 0.5, y: 0.5 }}
          />
        )}
      </MapView>

      {!readOnly && showAttendance && (
        <View style={styles.attendanceBox}>
          <Text style={styles.attendanceTitle}>
            Stop {currentStop} Attendance
          </Text>

          {attendanceList.map((s, i) => (
            <View key={s.id} style={styles.studentRow}>
              <Text style={styles.studentName}>{s.name}</Text>
              <CheckBox
                value={s.present}
                onValueChange={v => {
                  const copy = [...attendanceList];
                  copy[i].present = v;
                  setAttendanceList(copy);
                }}
              />
            </View>
          ))}

          <View style={{ marginTop: 10 }}>
            <Button
              title="Submit Attendance"
              onPress={handleSubmitAttendance}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  topBox: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  etaText: {
    fontSize: 14,
    color: '#666',
  },
  attendanceBox: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#fff',
    width: '100%',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  attendanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  studentName: {
    fontSize: 16,
    color: '#444',
  },
});
