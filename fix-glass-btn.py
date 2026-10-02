import sys

with open('mobile/src/components/ui/GlassButton.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add `color` to Props
content = content.replace("theme: 'light' | 'dark' | 'oled' | 'galaxy' | 'ocean' | 'desert' | string;\n    style?: ViewStyle | ViewStyle[];", 
                          "theme: 'light' | 'dark' | 'oled' | 'galaxy' | 'ocean' | 'desert' | string;\n    style?: ViewStyle | ViewStyle[];\n    color?: string;")

# Destructure color
content = content.replace("export function GlassButton({ onPress, children, theme, style }: GlassButtonProps) {",
                          "export function GlassButton({ onPress, children, theme, style, color }: GlassButtonProps) {")

# Add the overlay
search_overlay = """                <GlassView 
                    glassEffectStyle="regular"
                    colorScheme={isLight ? 'light' : 'dark'}
                    style={[StyleSheet.absoluteFill, { borderRadius: finalBorderRadius }]} 
                />
                
                {children}"""

replace_overlay = """                <GlassView 
                    glassEffectStyle="regular"
                    colorScheme={isLight ? 'light' : 'dark'}
                    style={[StyleSheet.absoluteFill, { borderRadius: finalBorderRadius }]} 
                />
                <Animated.View style={[
                    StyleSheet.absoluteFill,
                    { 
                        borderRadius: finalBorderRadius,
                        backgroundColor: color || (isLight ? '#ffffff' : '#000000'),
                        opacity: color ? 0.4 : bgOpacityAnim
                    }
                ]} />
                <Animated.View style={[
                    StyleSheet.absoluteFill,
                    { 
                        borderRadius: finalBorderRadius,
                        backgroundColor: '#000',
                        opacity: Animated.subtract(bgOpacityAnim, baseOpacity) // Solo se oscurece al presionar
                    }
                ]} />
                
                {children}"""

content = content.replace(search_overlay, replace_overlay)

with open('mobile/src/components/ui/GlassButton.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated GlassButton")
