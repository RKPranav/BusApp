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

const ManageParents = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [stop, setStop] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/students`);
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSave = async () => {
    if (!studentName || !password || !busNumber || !stop) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const url = isEditing
      ? `${BASE_URL}/admin/students/${studentName}`
      : `${BASE_URL}/admin/students`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, password, busNumber, stop }),
      });

      if (res.ok) {
        setModalVisible(false);
        setStudentName('');
        setPassword('');
        setBusNumber('');
        setStop('');
        fetchStudents();
        Alert.alert('Success', `Student ${isEditing ? 'Updated' : 'Added'}`);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Operation failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    }
  };

  const handleDelete = async itemStudentName => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${itemStudentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${BASE_URL}/admin/students/${itemStudentName}`, {
                method: 'DELETE',
              });
              fetchStudents();
            } catch (error) {
              Alert.alert('Error', 'Could not delete');
            }
          },
        },
      ],
    );
  };

  const openEdit = item => {
    setStudentName(item.studentName);
    setPassword(item.password);
    setBusNumber(item.busNumber);
    setStop(item.stop);
    setIsEditing(true);
    setModalVisible(true);
  };

  const openAdd = () => {
    setStudentName('');
    setPassword('');
    setBusNumber('');
    setStop('');
    setIsEditing(false);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.studentName}</Text>
        <Text style={styles.cardSubtitle}>
          Bus: {item.busNumber} | Stop: {item.stop}
        </Text>
        <Text style={styles.cardSubtitle}>Pass: {item.password}</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.studentName)}
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
          <Text style={styles.title}>Manage Parents</Text>
          <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={students}
          keyExtractor={item => item.studentName}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
        />

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Parent' : 'Add New Parent'}
              </Text>

              <TextInput
                placeholder="Student Name"
                style={styles.input}
                value={studentName}
                onChangeText={setStudentName}
                editable={!isEditing}
              />
              <TextInput
                placeholder="Password"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                placeholder="Bus Number (e.g., BUS101)"
                style={styles.input}
                value={busNumber}
                onChangeText={setBusNumber}
              />
              <TextInput
                placeholder="Stop Name (e.g., Stop 1)"
                style={styles.input}
                value={stop}
                onChangeText={setStop}
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

// Helper component for buttons inside Modal
const Button = ({ title, onPress, color = '#007bff' }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.modalBtn, { backgroundColor: color }]}
  >
    <Text style={styles.modalBtnText}>{title}</Text>
  </TouchableOpacity>
);

export default ManageParents;

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
  actionRow: { flexDirection: 'row', marginLeft: 10 },
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
