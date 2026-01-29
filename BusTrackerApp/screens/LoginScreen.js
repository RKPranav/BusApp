import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');

  const login = async () => {
    const url =
      role === 'driver'
        ? 'http://10.0.2.2:3000/login/driver'
        : 'http://10.0.2.2:3000/login/parent';

    const body =
      role === 'driver'
        ? { busNumber: username, password }
        : { studentName: username, password };

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
