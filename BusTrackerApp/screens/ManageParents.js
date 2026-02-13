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

const ManageParents = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState(''); // Added email for Auth
  const [password, setPassword] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [stop, setStop] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'parent'));
      const querySnapshot = await getDocs(q);
      const studentList = [];
      querySnapshot.forEach(userDoc => {
        studentList.push({ id: userDoc.id, ...userDoc.data() });
      });
      setStudents(studentList);
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Error', 'Failed to fetch parents');
    }
  };

  const handleSave = async () => {
    if (
      !studentName ||
      !busNumber ||
      !stop ||
      (!isEditing && (!email || !password))
    ) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      if (isEditing) {
        // Update Firestore Doc Only
        const parentRef = doc(db, 'users', isEditing);
        await updateDoc(parentRef, { studentName, busNumber, stop });
        Alert.alert('Success', 'Parent Updated (Password unchanged)');
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
          studentName,
          busNumber,
          stop: parseInt(stop) || stop, // Ensure stop is handled correctly
          role: 'parent',
          createdAt: new Date(),
        });
        Alert.alert('Success', 'Parent Added');
      }

      setModalVisible(false);
      setStudentName('');
      setEmail('');
      setPassword('');
      setBusNumber('');
      setStop('');
      setIsEditing(false);
      fetchStudents();
    } catch (error) {
      console.error('Save error: ', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = async id => {
    Alert.alert(
      'Delete Parent',
      'Are you sure? This will remove the parent from the list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', id));
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
    setEmail(item.email || '');
    setPassword('******');
    setBusNumber(item.busNumber);
    setStop(item.stop ? String(item.stop) : '');
    setIsEditing(item.id);
    setModalVisible(true);
  };

  const openAdd = () => {
    setStudentName('');
    setEmail('');
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
          <Text style={styles.title}>Manage Parents</Text>
          <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={students}
          keyExtractor={item => item.id}
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
              />
              <TextInput
                placeholder="Email Address"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                editable={!isEditing}
              />
              <TextInput
                placeholder="Password"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={false}
                editable={!isEditing}
              />
              {isEditing && (
                <Text style={{ fontSize: 10, color: 'red', marginBottom: 10 }}>
                  * Password cannot be changed here
                </Text>
              )}

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
