import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver'); // driver, parent, admin

  const createProfileAndLogin = async user => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const newProfile = {
        role,
        email: user.email,
        createdAt: serverTimestamp(),
      };

      await setDoc(userDocRef, newProfile);
      console.log('Created new user profile:', newProfile);

      Alert.alert('Success', 'Profile created successfully');

      // Navigate
      if (role === 'driver') {
        navigation.replace('DriverDashboard', { ...newProfile, uid: user.uid });
      } else if (role === 'parent') {
        navigation.replace('ParentDashboard', { ...newProfile, uid: user.uid });
      } else if (role === 'admin') {
        navigation.replace('AdminDashboard', { ...newProfile, uid: user.uid });
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert('Error', 'Failed to create user profile');
    }
  };

  const login = async () => {
    console.log('Login attempt started with:', email, role);
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      // 1. Authenticate with Firebase Auth
      console.log('Authenticating with Firebase...');
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      console.log('Firebase Auth successful, UID:', user.uid);

      // 2. Fetch User Role & Data from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      console.log(
        'Fetching user data from Firestore path:',
        `users/${user.uid}`,
      );
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data found:', userData);

        // 3. Verify Role
        if (userData.role !== role) {
          console.log(`Role mismatch: expected ${role}, got ${userData.role}`);
          Alert.alert('Access Denied', `You are not registered as a ${role}`);
          return;
        }

        // 4. Navigate based on role
        console.log('Navigating to dashboard...');
        if (userData.role === 'driver') {
          navigation.replace('DriverDashboard', { ...userData, uid: user.uid });
        } else if (userData.role === 'parent') {
          navigation.replace('ParentDashboard', { ...userData, uid: user.uid });
        } else if (userData.role === 'admin') {
          navigation.replace('AdminDashboard', { ...userData, uid: user.uid });
        }
      } else {
        console.log(
          'User document does not exist in Firestore. Auto-creating profile...',
        );
        // Directly create profile without Alert, to avoid context issues
        await createProfileAndLogin(user);
      }
    } catch (error) {
      console.error('Login error full object:', error);
      let msg = 'Login failed';
      if (error.code === 'auth/invalid-email') msg = 'Invalid email address';
      if (error.code === 'auth/user-not-found') msg = 'User not found';
      if (error.code === 'auth/wrong-password') msg = 'Incorrect password';
      Alert.alert('Login Error', msg);
    }
  };

  const getPlaceholder = () => {
    return 'Email Address';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{role.toUpperCase()} LOGIN</Text>

      <View style={styles.switchContainer}>
        <TouchableOpacity
          onPress={() => setRole('driver')}
          style={[styles.switchBtn, role === 'driver' && styles.activeBtn]}
        >
          <Text
            style={[styles.switchText, role === 'driver' && styles.activeText]}
          >
            Driver
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRole('parent')}
          style={[styles.switchBtn, role === 'parent' && styles.activeBtn]}
        >
          <Text
            style={[styles.switchText, role === 'parent' && styles.activeText]}
          >
            Parent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRole('admin')}
          style={[styles.switchBtn, role === 'admin' && styles.activeBtn]}
        >
          <Text
            style={[styles.switchText, role === 'admin' && styles.activeText]}
          >
            Admin
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder={getPlaceholder()}
        style={styles.input}
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />

      <Button title="Login" onPress={login} />
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    padding: 10,
    borderRadius: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  switchBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    flex: 1,
    alignItems: 'center',
  },
  activeBtn: { backgroundColor: '#007bff', borderColor: '#007bff' },
  switchText: { color: '#333' },
  activeText: { color: '#fff', fontWeight: 'bold' },
});
