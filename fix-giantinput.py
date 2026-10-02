import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_giant_input = """const GiantInput = ({ value, onChangeText, keyboardType, placeholder, unit, colors, autoFocus = false }: any) => {
    const [isFocused, setIsFocused] = useState(false);
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
        <View style={{ 
          borderBottomWidth: 3, 
          borderBottomColor: isFocused ? colors.tint : 'transparent',
          paddingBottom: 4,
          shadowColor: colors.tint,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isFocused ? 0.3 : 0,
          shadowRadius: 8,
        }}>
          <TextInput 
            style={[styles.giantInput, { color: colors.text, minWidth: 160 }]}"""

new_giant_input = """const GiantInput = ({ value, onChangeText, keyboardType, placeholder, unit, colors, autoFocus = false }: any) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    
    return (
      <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
        <View style={{ 
          borderBottomWidth: 3, 
          borderBottomColor: isFocused ? colors.tint : 'transparent',
          paddingBottom: 4,
          shadowColor: colors.tint,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isFocused ? 0.3 : 0,
          shadowRadius: 8,
        }}>
          <TextInput 
            ref={inputRef}
            style={[styles.giantInput, { color: colors.text, minWidth: 160 }]}"""

content = content.replace(old_giant_input, new_giant_input)

# Also need to replace the closing tag of GiantInput's outer View with TouchableOpacity
content = content.replace(
    "</Text>\n      </View>\n    );\n  };",
    "</Text>\n      </TouchableOpacity>\n    );\n  };"
)

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated GiantInput with tap forwarding")
