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
import { BASE_URL } from '../config/api';

const ManageDrivers = ({ navigation }) => {
  const [drivers, setDrivers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [busNumber, setBusNumber] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/drivers`);
      const data = await res.json();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleSave = async () => {
    if (!busNumber || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const url = isEditing
      ? `${BASE_URL}/admin/drivers/${busNumber}`
      : `${BASE_URL}/admin/drivers`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busNumber, password }),
      });

      if (res.ok) {
        setModalVisible(false);
        setBusNumber('');
        setPassword('');
        fetchDrivers();
        Alert.alert('Success', `Driver ${isEditing ? 'Updated' : 'Added'}`);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Operation failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    }
  };

  const handleDelete = async itemsBusNumber => {
    Alert.alert(
      'Delete Driver',
      `Are you sure you want to delete ${itemsBusNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${BASE_URL}/admin/drivers/${itemsBusNumber}`, {
                method: 'DELETE',
              });
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
    setPassword(item.password);
    setIsEditing(true);
    setModalVisible(true);
  };

  const openAdd = () => {
    setBusNumber('');
    setPassword('');
    setIsEditing(false);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardTitle}>Bus: {item.busNumber}</Text>
        <Text style={styles.cardSubtitle}>Pass: {item.password}</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.busNumber)}
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
          keyExtractor={item => item.busNumber}
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
                placeholder="Bus Number (e.g., BUS101)"
                style={styles.input}
                value={busNumber}
                onChangeText={setBusNumber}
                editable={!isEditing} // Bus Number is ID, usually immutable or needs proper handling
              />
              <TextInput
                placeholder="Password"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />

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
