import { View, Text } from 'react-native';
import ThemeBackground from '@/components/ThemeBackground';
export default function Routines() { return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent'}}><ThemeBackground /><Text style={{color: '#fff', fontSize: 24, fontWeight: 'bold'}}>Rutinas</Text></View>; }