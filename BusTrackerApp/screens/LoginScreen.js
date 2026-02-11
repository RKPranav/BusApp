import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { BASE_URL } from '../config/api';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver'); // driver, parent, admin

  const login = async () => {
    let url = `${BASE_URL}/login/driver`;
    let body = { busNumber: username, password };

    if (role === 'parent') {
      url = `${BASE_URL}/login/parent`;
      body = { studentName: username, password };
    } else if (role === 'admin') {
      url = `${BASE_URL}/login/admin`;
      body = { username, password };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        alert('Invalid credentials');
        return;
      }

      const data = await res.json();

      if (data.role === 'driver') {
        navigation.replace('DriverDashboard', data);
      } else if (data.role === 'parent') {
        navigation.replace('ParentDashboard', data);
      } else if (data.role === 'admin') {
        navigation.replace('AdminDashboard', data);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please check your connection or server.');
    }
  };

  const getPlaceholder = () => {
    if (role === 'driver') return 'Bus Number';
    if (role === 'parent') return 'Student Name';
    return 'Admin Username';
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
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        onChangeText={setPassword}
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
