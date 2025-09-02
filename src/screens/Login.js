import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hotelGroupId, setHotelGroupId] = useState(0);
  const [hotelList, setHotelList] = useState([]);

  // Auto-login if session exists
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await AsyncStorage.getItem('userSession');
        if (session) {
          const userData = JSON.parse(session);
          navigation.replace('Dashboard', userData);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://rnsoftwares.com/XpressOwnerAndroid/login_new.php?user_name=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`
      );

      const result = await response.json();
      setLoading(false);

      if (result?.result?.length > 0) {
        const user = result.result[0];

        if (user.status === '1') {
          const sessionData = {
            hotelid: user.hotel_id,
            login_id: user.login_id,
            username: user.u_name,
            HotelGroupId: user.HotelGroupId,
            pos_hotel_id: user.pos_hotel_id,
          };

          await AsyncStorage.setItem('userSession', JSON.stringify(sessionData));

          setHotelGroupId(parseInt(user.HotelGroupId));
          navigation.replace('Dashboard', sessionData);
        } else {
          Alert.alert('Login Failed', 'Account is inactive.');
        }
      } else {
        Alert.alert('Login Failed', 'Invalid username or password.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Login Error:', error);
      Alert.alert('Network Error', 'Unable to connect to the server.');
    }
  };

  const fetchHotelsByGroup = async () => {
    try {
      const response = await fetch(
        `https://rnsoftwares.com/XpressOwnerAndroid/get_hotels_from_grp3.php?group_id=${hotelGroupId}`
      );
      const json = await response.json();
      const hotels = json?.result || [];

      if (hotels.length > 0) {
        const hotelNames = hotels.map(h => h.HotelName).join('\n');
        Alert.alert('Select Hotel', hotelNames);
        setHotelList(hotels);
      } else {
        Alert.alert('No Hotels Found', 'No hotels are linked to this group.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch hotel list');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../Assets/Logo/login.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Username"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#ccc"
            secureTextEntry={secure}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
           <TouchableOpacity onPress={() => setSecure(!secure)} style={styles.eyeButton}>
            <Text style={styles.eyeIcon}>{secure ? '👀' : '🙈'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#0055A5" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        {hotelGroupId !== 0 && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#2A9D8F', marginTop: 15 }]}
            onPress={fetchHotelsByGroup}
          >
            <Text style={styles.buttonText}>View Group Hotels</Text>
          </TouchableOpacity>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0055A5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 25,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 10,
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#0055A5',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
