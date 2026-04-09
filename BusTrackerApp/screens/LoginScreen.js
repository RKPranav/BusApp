import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  UIManager,
  LayoutAnimation,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null); // driver, parent, admin
  const [isLoading, setIsLoading] = useState(false);

  const toggleRole = (role) => {
    // Smooth layout animation on press
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (selectedRole === role) {
      // Collapse if already open
      setSelectedRole(null);
    } else {
      // Clear inputs when switching roles
      setEmail('');
      setPassword('');
      setSelectedRole(role);
    }
  };

  const createProfileAndLogin = async (user, role) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const newProfile = {
        role,
        email: user.email,
        createdAt: serverTimestamp(),
      };

      await setDoc(userDocRef, newProfile);
      console.log('Created new user profile:', newProfile);

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
    if (!selectedRole) return;
    console.log('Login attempt started with:', email, selectedRole);
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
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
        if (userData.role !== selectedRole) {
          console.log(`Role mismatch: expected ${selectedRole}, got ${userData.role}`);
          Alert.alert('Access Denied', `You are not registered as a ${selectedRole}`);
          setIsLoading(false);
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
        await createProfileAndLogin(user, selectedRole);
      }
    } catch (error) {
      console.error('Login error full object:', error);
      let msg = 'Login failed';
      if (error.code === 'auth/invalid-email') msg = 'Invalid email address';
      if (error.code === 'auth/user-not-found') msg = 'User not found';
      if (error.code === 'auth/wrong-password') msg = 'Incorrect password';
      Alert.alert('Login Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert("Coming Soon", "Forgot Password functionality will be available in a future update.");
  };

  const renderRoleCard = (roleKey, title, icon, color) => {
    const isExpanded = selectedRole === roleKey;

    return (
      <View style={[styles.cardWrapper, isExpanded && styles.cardWrapperExpanded]}>
        <TouchableOpacity
          style={[
            styles.roleHeader,
            isExpanded ? { backgroundColor: color } : { backgroundColor: '#FFFFFF' }
          ]}
          onPress={() => toggleRole(roleKey)}
          activeOpacity={0.8}
        >
          <View style={styles.roleHeaderLeft}>
            <Text style={[styles.roleIcon, isExpanded && styles.roleIconExpanded]}>{icon}</Text>
            <Text style={[styles.roleTitle, isExpanded && styles.roleTitleExpanded]}>{title}</Text>
          </View>
          <Text style={[styles.expandIcon, isExpanded && styles.expandIconExpanded]}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.formContainer}>
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              onChangeText={setEmail}
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              secureTextEntry
              onChangeText={setPassword}
              value={password}
            />
            
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginBtn, { backgroundColor: color }, isLoading && styles.loginBtnDisabled]} 
              onPress={login}
              disabled={isLoading}
            >
              <Text style={styles.loginBtnText}>
                {isLoading ? 'Authenticating...' : `Login as ${title}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.logoIcon}>🚌</Text>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.brandText}>Smart Bus</Text>
            <Text style={styles.subtitleText}>Please select your role to continue</Text>
          </View>

          {/* Role Cards Section */}
          <View style={styles.rolesContainer}>
            {renderRoleCard('driver', 'Driver', '🚍', '#4F46E5')}
            {renderRoleCard('parent', 'Parent', '👨‍👩‍👧', '#10B981')}
            {renderRoleCard('admin', 'Admin', '⚙️', '#F59E0B')}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    color: '#374151',
    fontWeight: '500',
  },
  brandText: {
    fontSize: 36,
    color: '#111827',
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  rolesContainer: {
    gap: 16,
    paddingBottom: 40,
  },
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  cardWrapperExpanded: {
    shadowOpacity: 0.1,
    elevation: 6,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
  },
  roleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  roleIconExpanded: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 4,
    overflow: 'hidden',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  roleTitleExpanded: {
    color: '#FFFFFF',
  },
  expandIcon: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '900',
  },
  expandIconExpanded: {
    color: '#FFFFFF',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#111827',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  loginBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
