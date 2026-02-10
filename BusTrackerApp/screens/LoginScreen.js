import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { BASE_URL } from '../config/api';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');

  const login = async () => {
    const url =
      role === 'driver'
        ? `${BASE_URL}/login/driver`
        : `${BASE_URL}/login/parent`;

    const body =
      role === 'driver'
        ? { busNumber: username, password }
        : { studentName: username, password };

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
      } else {
        navigation.replace('ParentDashboard', data);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please check your connection or server.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{role.toUpperCase()} LOGIN</Text>

      <TextInput
        placeholder={role === 'driver' ? 'Bus Number' : 'Student Name'}
        style={styles.input}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        onChangeText={setPassword}
      />

      <Button title="Login" onPress={login} />

      <Button
        title={`Switch to ${role === 'driver' ? 'Parent' : 'Driver'}`}
        onPress={() => setRole(role === 'driver' ? 'parent' : 'driver')}
      />
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, marginBottom: 12, padding: 10 },
});
