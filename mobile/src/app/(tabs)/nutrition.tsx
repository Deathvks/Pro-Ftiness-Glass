import { View, Text } from 'react-native';
import ThemeBackground from '@/components/ThemeBackground';
export default function Nutrition() { return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent'}}><ThemeBackground /><Text style={{color: '#fff', fontSize: 24, fontWeight: 'bold'}}>Nutrición</Text></View>; }