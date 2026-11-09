import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Platform } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';

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
  theme: 'light' | 'dark' | string;
  colors: any;
}

export function SelectModal({
  visible,
  onClose,
  options,
  value,
  onSelect,
  title,
  theme,
  colors,
}: SelectModalProps) {
  const screenHeight = Dimensions.get('window').height;
  const isDark = !['light', 'ocean', 'desert'].includes(theme || '');
  const isIOS = Platform.OS === 'ios';

  return (
    <SwipeableBottomSheet
      scrollable
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.background === 'transparent' ? colors.card : colors.background}
      maxHeight={screenHeight * 0.72}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 6,
          paddingBottom: 14,
          borderBottomWidth: isIOS ? StyleSheet.hairlineWidth : 1,
          borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }}
      >
        <Text
          style={{
            fontSize: 19,
            fontWeight: isIOS ? '700' : '800',
            letterSpacing: -0.4,
            color: colors.text,
          }}
        >
          {title}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            borderRadius: 16,
          }}
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {options.map((opt, i) => {
          if (opt.isHeader) {
            return (
              <Text
                key={`header-${i}`}
                style={{
                  color: colors.tint,
                  fontWeight: '700',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginTop: i > 0 ? 16 : 0,
                  marginBottom: 8,
                  paddingHorizontal: 8,
                }}
              >
                {opt.label}
              </Text>
            );
          }

          const isSelected = String(value) === String(opt.value);

          return (
            <TouchableOpacity
              key={`opt-${opt.value}`}
              activeOpacity={0.75}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  backgroundColor: isSelected ? colors.tint + '18' : colors.card,
                  borderRadius: 14,
                  borderCurve: 'continuous',
                  marginBottom: 8,
                  borderWidth: isIOS && !isSelected ? 0 : 1,
                  borderColor: isSelected ? colors.tint : colors.border,
                },
                !isSelected && getAppleSheetCardStyle(isDark, 14),
              ]}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? colors.tint : colors.text,
                }}
              >
                {opt.label}
              </Text>
              {isSelected && <Check size={18} color={colors.tint} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SwipeableBottomSheet>
  );
}
