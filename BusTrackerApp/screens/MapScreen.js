import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  UrlTile,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
import CheckBox from '@react-native-community/checkbox';
import { setupNotifications, notifyBeforeStop } from '../utils/notifications';

/* FIXED ROUTE */
const START_POINT = {
  latitude: 12.907609209246655,
  longitude: 77.47634064715605,
};
const END_POINT = { latitude: 12.86377436214521, longitude: 77.43479290230692 };

const MOVE_INTERVAL_MS = 1000; // Increased to 1s for smoother updates/less network load

const MapScreen = ({ busNumber, parentStop, readOnly = false }) => {
  const mapRef = useRef(null);

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
  // Parent Polling
  useEffect(() => {
    let pollInterval;

    // Only fetch route and start polling if readOnly (Parent)
    if (readOnly) {
      setConnectionStatus('Connecting...');
      // 1. Fetch Route for visualization
      getRouteFromOSRM()
        .then(({ coords, stopIndices }) => {
          setRoute(coords);
          setRouteStops(stopIndices.map(i => coords[i]));
        })
        .catch(() => {
          // Silent catch or simple log for parent view initial fetch
          console.log('Failed to fetch route for parent view');
        });

      // 2. Poll for bus location
      pollInterval = setInterval(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        try {
          // Use 10.0.2.2 for emulator accessing host
          const res = await fetch(
            `http://10.0.2.2:3000/bus/status?busNumber=${busNumber || '1'}`,
            { signal: controller.signal },
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            setConnectionStatus('Online');

            if (data.location) {
              setBusPosition(data.location);
              setStatusText(
                data.nextStop ? `Next Stop: ${data.nextStop}` : 'Bus Moving',
              );

              if (data.eta !== undefined) setEtaSeconds(data.eta);
              if (data.etaLabel) setEtaLabel(data.etaLabel);

              // Animate camera to new position
              mapRef.current?.animateCamera({
                center: data.location,
                zoom: 16,
              });
            }
          } else if (res.status === 404) {
            setConnectionStatus('Waiting for Bus...');
            setStatusText('Bus Not Started');
          } else {
            setConnectionStatus(`Server Error: ${res.status}`);
          }
        } catch (err) {
          if (err.name === 'AbortError') {
            console.log('Polling timeout');
            setConnectionStatus('Timeout');
          } else {
            console.log('Polling error', err);
            setConnectionStatus('Connection Error');
          }
        }
      }, 2000);
    }

    // Cleanup
    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, busNumber]);

  const handleShowRoute = async () => {
    if (readOnly) return;

    setBusStarted(false);
    setStatusText('Starting...');
    setEtaLabel('Calculating...');

    try {
      const { coords, stopIndices } = await getRouteFromOSRM();

      setRoute(coords);
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
      mapRef.current?.animateCamera({ center: pos, zoom: 16 });

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

      // SYNC: Update backend with ETA
      fetch('http://10.0.2.2:3000/bus/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busNumber: busNumber || '1',
          location: pos,
          nextStop: stopNumber,
          eta: eta,
          etaLabel: currentEtaLabel,
        }),
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

    attendanceList.forEach(s => {
      if (s.present) {
        fetch('http://10.0.2.2:3000/notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            busNumber,
            stopNumber: currentStop,
            studentName: s.name,
            message: `${s.name} has boarded the bus`,
          }),
        });
      }
    });

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
        provider={PROVIDER_DEFAULT}
        mapType="standard"
        initialRegion={{
          latitude: START_POINT.latitude,
          longitude: START_POINT.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onMapReady={() => setMapReady(true)}
      >
        {/* OPENSTREETMAP TILES */}
        <UrlTile
          urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          zIndex={100}
        />

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
