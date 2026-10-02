import sys

with open('mobile/src/components/ui/GlassButton.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search_overlay = """                <Animated.View style={[
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
                ]} />"""

replace_overlay = """                <Animated.View style={[
                    StyleSheet.absoluteFill,
                    { 
                        borderRadius: finalBorderRadius,
                        backgroundColor: color || (isLight ? '#ffffff' : '#000000'),
                        opacity: bgOpacityAnim
                    }
                ]} />"""

content = content.replace(search_overlay, replace_overlay)

with open('mobile/src/components/ui/GlassButton.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Simplified GlassButton overlay")
