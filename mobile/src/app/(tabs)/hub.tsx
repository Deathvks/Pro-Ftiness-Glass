import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Hub() {
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);
  const colors = Colors[theme] || Colors.oled;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 20 }}>Ajustes de Tema</Text>
        
        {['light', 'dark', 'oled'].map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTheme(t)}
            style={{
              backgroundColor: colors.card,
              padding: 15,
              borderRadius: 12,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: theme === t ? colors.tint : colors.border
            }}
          >
            <Text style={{ color: colors.text, textTransform: 'capitalize' }}>Tema {t}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}