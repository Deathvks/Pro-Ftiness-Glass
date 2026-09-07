import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleLogin = useAppStore(state => state.handleLogin);
  const router = useRouter();

  const handleLoginSubmit = async () => {
    try {
      await handleLogin({ email, password });
      // Redireccion automatica de _layout.tsx lo pillara
    } catch (e) {
      console.error(e);
      alert('Error de conexión o datos incorrectos');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#000' }}>
      <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' }}>Pro Fitness</Text>
      <TextInput 
        style={{ backgroundColor: '#222', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 }}
        placeholder='Email'
        placeholderTextColor='#888'
        value={email}
        onChangeText={setEmail}
        autoCapitalize='none'
      />
      <TextInput 
        style={{ backgroundColor: '#222', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 30 }}
        placeholder='Contraseña'
        placeholderTextColor='#888'
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity 
        style={{ backgroundColor: '#3b82f6', padding: 15, borderRadius: 10, alignItems: 'center' }}
        onPress={handleLoginSubmit}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}
