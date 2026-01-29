import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import CheckBox from '@react-native-community/checkbox';
import { setupNotifications, notifyBeforeStop } from '../utils/notifications';

/* FIXED ROUTE */
const START_POINT = { latitude: 12.9076, longitude: 77.4846 };
const END_POINT = { latitude: 12.8916, longitude: 77.5675 };

const MOVE_INTERVAL_MS = 500;

const MapScreen = ({ busNumber, parentStop, readOnly = false }) => {
  const mapRef = useRef(null);

  const [route, setRoute] = useState([]);
  const [routeStops, setRouteStops] = useState([]);
  const [busPosition, setBusPosition] = useState(null);

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

  useEffect(() => {
    setupNotifications();
  }, []);

  /* STUDENTS */
  const studentsByStop = {
    1: [
      { id: 1, name: 'Ravi', present: false },
      { id: 2, name: 'Anu', present: false },
      { id: 3, name: 'Kiran', present: false },
      { id: 4, name: 'Meena', present: false },
    ],
    2: [
      { id: 5, name: 'Suresh', present: false },
      { id: 6, name: 'Divya', present: false },
      { id: 7, name: 'Aakash', present: false },
      { id: 8, name: 'Nithin', present: false },
    ],
    3: [
      { id: 9, name: 'Pooja', present: false },
      { id: 10, name: 'Rahul', present: false },
      { id: 11, name: 'Sneha', present: false },
      { id: 12, name: 'Vikas', present: false },
    ],
  };

  const calculateEtaToNextStop = (currentIndex, nextStopIndex) =>
    Math.max(
      0,
      Math.ceil(((nextStopIndex - currentIndex) * MOVE_INTERVAL_MS) / 1000),
    );

  const fetchRoute = async () => {
    const url = `https://router.project-osrm.org/route/v1/driving/${START_POINT.longitude},${START_POINT.latitude};${END_POINT.longitude},${END_POINT.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();

    const coords = json.routes[0].geometry.coordinates.map(c => ({
      latitude: c[1],
      longitude: c[0],
    }));

    const stopIndices = [
      Math.floor(coords.length * 0.25),
      Math.floor(coords.length * 0.5),
      Math.floor(coords.length * 0.75),
    ];

    setRoute(coords);
    setRouteStops(stopIndices.map(i => coords[i]));
    setBusPosition(coords[0]);

    startBusAnimation(coords, stopIndices, 1);
  };

  const handleShowRoute = () => {
    setBusStarted(false);
    setStatusText('Running');
    setEtaLabel('ETA to Stop 1');
    fetchRoute();
  };

  const startBusAnimation = (coords, stopIndices, stopNumber) => {
    let index = 0;
    let hasNotified = false;

    if (!busStarted) {
      Alert.alert('Bus Started', 'The bus has started 🚍');
      setBusStarted(true);
    }

    const interval = setInterval(() => {
      if (index >= coords.length - 1) {
        clearInterval(interval);
        setStatusText('Reached Destination');
        setEtaSeconds(0);
        return;
      }

      const pos = coords[index];
      setBusPosition(pos);

      mapRef.current?.animateCamera({ center: pos, zoom: 16 });

      if (stopIndices.length > 0) {
        const eta = calculateEtaToNextStop(index, stopIndices[0]);
        setEtaSeconds(eta);
        setEtaLabel(`ETA to Stop ${stopNumber}`);

        if (eta <= 8 && !hasNotified) {
          notifyBeforeStop(stopNumber);
          hasNotified = true;
        }
      }

      if (stopIndices.length > 0 && index === stopIndices[0]) {
        clearInterval(interval);

        setStatusText(`Halted at Stop ${stopNumber}`);
        setPausedRoute(coords.slice(index + 1));
        setPausedStopIndices(stopIndices.slice(1).map(i => i - index - 1));
        setNextStopNumber(stopNumber + 1);

        setCurrentStop(stopNumber);
        setAttendanceList(studentsByStop[stopNumber]);
        setShowAttendance(true);
        return;
      }

      index++;
    }, MOVE_INTERVAL_MS);
  };

  const handleSubmitAttendance = async () => {
    await fetch('http://10.0.2.2:3000/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        busNumber,
        stopNumber: currentStop,
        students: attendanceList,
      }),
    });

    Alert.alert('Attendance Saved', 'Bus will continue');

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
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.topBox}>
        <Text>Status: {statusText}</Text>
        <Text>
          {etaLabel}: {etaSeconds} sec
        </Text>
        {!readOnly && <Button title="Show Route" onPress={handleShowRoute} />}
      </View>

      <MapView ref={mapRef} style={{ flex: 1 }} provider={PROVIDER_DEFAULT}>
        {route.length > 0 && <Polyline coordinates={route} strokeWidth={5} />}

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
          <Text>Stop {currentStop} Attendance</Text>

          {attendanceList.map((s, i) => (
            <View key={s.id} style={styles.studentRow}>
              <Text>{s.name}</Text>
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

          <Button title="Submit Attendance" onPress={handleSubmitAttendance} />
        </View>
      )}
    </SafeAreaView>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  topBox: { padding: 10, alignItems: 'center' },
  attendanceBox: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#fff',
    width: '100%',
    padding: 15,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
