import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface SelectOption {
  label: string;
  value: string | number;
  isHeader?: boolean;
}

interface SelectModalProps {
  visible: boolean;
  onClose: () => void;
  options: SelectOption[];
  value: string | number;
  onSelect: (value: string | number) => void;
  title: string;
  theme: 'light' | 'dark';
  colors: any;
}

export function SelectModal({ visible, onClose, options, value, onSelect, title, theme, colors }: SelectModalProps) {
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
        </TouchableOpacity>
        
        <View style={{ 
          backgroundColor: colors.background, 
          borderTopLeftRadius: 24, 
          borderTopRightRadius: 24, 
          maxHeight: screenHeight * 0.7,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
          borderWidth: 1,
          borderColor: colors.border,
          borderBottomWidth: 0,
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 6, backgroundColor: colors.card, borderRadius: 12 }}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {/* List */}
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {options.map((opt, i) => {
              if (opt.isHeader) {
                return (
                  <Text key={`header-${i}`} style={{ color: colors.tint, fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', marginTop: i > 0 ? 16 : 0, marginBottom: 8, paddingHorizontal: 8 }}>
                    {opt.label}
                  </Text>
                );
              }
              
              const isSelected = String(value) === String(opt.value);
              
              return (
                <TouchableOpacity 
                  key={`opt-${opt.value}`}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    backgroundColor: isSelected ? colors.tint + '15' : colors.card,
                    borderRadius: 12,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.tint : colors.border
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: isSelected ? 'bold' : '500', color: isSelected ? colors.tint : colors.text }}>
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={18} color={colors.tint} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
