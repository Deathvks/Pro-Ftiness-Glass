import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Globe, Users, Lock, CheckCircle, X } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useAppStore(state => state.theme);
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const [visibility, setVisibility] = useState('friends');

  useEffect(() => {
    if (visible) {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('globalWorkoutVisibility') : null;
      if (saved) setVisibility(saved);
    }
  }, [visible]);

  const handleSave = (val: string) => {
    setVisibility(val);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('globalWorkoutVisibility', val);
    }
    setTimeout(() => onClose(), 200);
  };

  const options = [
    { id: 'private', title: 'No subir', desc: 'Tus entrenamientos no aparecerán en el muro.', icon: Lock },
    { id: 'friends', title: 'Solo Amigos', desc: 'Tus amigos agregados verán tu actividad.', icon: Users },
    { id: 'public', title: 'Todo el mundo', desc: 'Cualquier usuario podrá ver tus entrenamientos.', icon: Globe },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', padding: 20 }]} onPress={onClose}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
            <GlassView 
              glassEffectStyle="regular"
              colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'}
              style={{ width: '100%', backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1, borderRadius: 32, overflow: 'hidden' }}
            >
              {/* Header */}
              <View style={{ padding: 24, paddingBottom: 16, alignItems: 'center' }}>
                <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 24, right: 24, width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <GlassView glassEffectStyle="regular" colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.tint + '15', borderWidth: 2, borderColor: colors.tint + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Globe size={32} color={getContrastColor(colors.tint, theme)} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>Privacidad del Muro</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 16 }}>¿Quién puede ver tus entrenamientos al finalizarlos?</Text>
              </View>

              {/* Options */}
              <View style={{ padding: 24, paddingTop: 8, gap: 12 }}>
                {options.map((opt) => {
                  const isSelected = visibility === opt.id;
                  const Icon = opt.icon;
                  return (
                    <TouchableOpacity 
                      key={opt.id} 
                      onPress={() => handleSave(opt.id)}
                      style={{ 
                        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, 
                        borderColor: isSelected ? colors.tint + '50' : colors.border,
                        overflow: 'hidden'
                      }}
                    >
                      <GlassView glassEffectStyle="regular" colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
                      {isSelected && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.tint, opacity: 0.1 }]} />}
                      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: isSelected ? colors.tint + '15' : colors.card, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                        <Icon size={20} color={isSelected ? getContrastColor(colors.tint, theme) : colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: isSelected ? colors.tint : colors.text, marginBottom: 2 }}>{opt.title}</Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>{opt.desc}</Text>
                      </View>
                      {isSelected && <CheckCircle size={20} color={getContrastColor(colors.tint, theme)} style={{ marginLeft: 12 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GlassView>
          </Pressable>
        </Pressable>
      </GlassView>
    </Modal>
  );
}


