import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

const ManageDrivers = ({ navigation }) => {
  const [drivers, setDrivers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [busNumber, setBusNumber] = useState('');
  const [email, setEmail] = useState(''); // Added email for Auth
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'driver'));
      const querySnapshot = await getDocs(q);
      const driverList = [];
      querySnapshot.forEach(doc => {
        driverList.push({ id: doc.id, ...doc.data() });
      });
      setDrivers(driverList);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      Alert.alert('Error', 'Failed to fetch drivers');
    }
  };

  const handleSave = async () => {
    if (!busNumber || (!isEditing && (!email || !password))) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      if (isEditing) {
        // Update Firestore Doc Only (Cannot update Auth password easily without re-login)
        const driverRef = doc(db, 'users', isEditing); // isEditing holds the doc ID
        await updateDoc(driverRef, { busNumber }); // Password update skipped for client-side simplicity
        Alert.alert('Success', 'Driver Updated (Password unchanged)');
      } else {
        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = userCredential.user;

        // 2. Create Firestore Profile
        await setDoc(doc(db, 'users', user.uid), {
          email,
          busNumber,
          role: 'driver',
          createdAt: new Date(),
        });
        Alert.alert('Success', 'Driver Added');
      }

      setModalVisible(false);
      setBusNumber('');
      setEmail('');
      setPassword('');
      setIsEditing(false);
      fetchDrivers();
    } catch (error) {
      console.error('Save error: ', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = async id => {
    Alert.alert(
      'Delete Driver',
      'Are you sure? This will remove the driver from the list. (Auth account remains)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', id));
              fetchDrivers();
            } catch (error) {
              Alert.alert('Error', 'Could not delete');
            }
          },
        },
      ],
    );
  };

  const openEdit = item => {
    setBusNumber(item.busNumber);
    setEmail(item.email || '');
    setPassword('******'); // Placeholder
    setIsEditing(item.id); // store ID to edit
    setModalVisible(true);
  };

  const openAdd = () => {
    setBusNumber('');
    setEmail('');
    setPassword('');
    setIsEditing(false);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardTitle}>Bus: {item.busNumber}</Text>
        <Text style={styles.cardSubtitle}>{item.email}</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={styles.deleteBtn}
        >
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Manage Drivers</Text>
          <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={drivers}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
        />

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Driver' : 'Add New Driver'}
              </Text>

              <TextInput
                placeholder="Email Address"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                editable={!isEditing} // Email is immutable for now
              />

              <TextInput
                placeholder="Bus Number (e.g., BUS101)"
                style={styles.input}
                value={busNumber}
                onChangeText={setBusNumber}
              />

              <TextInput
                placeholder="Password"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={false}
                editable={!isEditing} // Prevent password edit for simplicity
              />
              {isEditing && (
                <Text style={{ fontSize: 10, color: 'red', marginBottom: 10 }}>
                  * Password cannot be changed here
                </Text>
              )}

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  color="red"
                  onPress={() => setModalVisible(false)}
                />
                <Button title="Save" onPress={handleSave} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

// Helper component for buttons inside Modal to avoid React Native Button width issues
const Button = ({ title, onPress, color = '#007bff' }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.modalBtn, { backgroundColor: color }]}
  >
    <Text style={styles.modalBtnText}>{title}</Text>
  </TouchableOpacity>
);

export default ManageDrivers;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    padding: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 10, marginRight: 10 },
  backText: { fontSize: 16, color: '#007bff', fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  addBtn: { backgroundColor: '#28a745', padding: 10, borderRadius: 5 },
  addBtnText: { color: 'white', fontWeight: 'bold' },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, color: 'gray' },
  actionRow: { flexDirection: 'row' },
  editBtn: {
    backgroundColor: '#ffc107',
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  deleteBtn: { backgroundColor: '#dc3545', padding: 8, borderRadius: 5 },
  btnText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalBtnText: { color: 'white', fontWeight: 'bold' },
});
