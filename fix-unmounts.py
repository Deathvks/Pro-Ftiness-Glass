import sys
import re

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract BigOptionButton
big_option_button_regex = r"(\s*)const BigOptionButton = \(\{ selected, onPress, title, desc, icon: Icon \}: any\) => \([\s\S]*?\n  \);\n"
match_bob = re.search(big_option_button_regex, content)
bob_code = match_bob.group(0) if match_bob else ""
content = content.replace(bob_code, "")

# Modify BigOptionButton to take colors and colorScheme
bob_outside = """
const BigOptionButton = ({ selected, onPress, title, desc, icon: Icon, colors, colorScheme }: any) => (
  <GlassButton
    theme={colorScheme}
    color={selected ? colors.tint : undefined}
    onPress={onPress}
    style={[styles.bigOptionBtn, { marginBottom: 16, borderColor: selected ? colors.tint : colors.border + '60' }]}
  >
      <View style={[styles.iconBox, { backgroundColor: selected ? colors.tint : colors.card + '50' }]}>
        <Icon size={28} color={selected ? '#fff' : colors.text} />
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={[styles.optionTitle, { color: selected ? colors.tint : colors.text }]}>{title}</Text>
        <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{desc}</Text>
      </View>
  </GlassButton>
);
"""

# 2. Extract StepWrapper
step_wrapper_regex = r"(\s*)const StepWrapper = \(\{ children, stepNum \}: \{ children: React\.ReactNode, stepNum: number \}\) => \{[\s\S]*?\n  \};\n"
match_sw = re.search(step_wrapper_regex, content)
sw_code = match_sw.group(0) if match_sw else ""
content = content.replace(sw_code, "")

sw_outside = """
const StepWrapper = ({ children, stepNum, currentStep, direction }: { children: React.ReactNode, stepNum: number, currentStep: number, direction: 'left' | 'right' }) => {
  if (currentStep !== stepNum) return null;
  return (
    <Animated.View 
      entering={direction === 'right' ? FadeInRight.duration(400) : FadeInLeft.duration(400)} 
      exiting={FadeOut.duration(200)}
      style={{ width: '100%', flex: 1, paddingHorizontal: 24, paddingBottom: 120 }}
    >
      {children}
    </Animated.View>
  );
};
"""

# Add them outside the component (before export default function Onboarding() { )
export_idx = content.find("export default function Onboarding() {")
content = content[:export_idx] + bob_outside + "\n" + sw_outside + "\n" + content[export_idx:]

# 3. Update usages of StepWrapper
content = content.replace("<StepWrapper stepNum={", "<StepWrapper currentStep={step} direction={direction} stepNum={")

# 4. Update usages of BigOptionButton
content = content.replace("<BigOptionButton ", "<BigOptionButton colors={colors} colorScheme={colorScheme} ")

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Moved StepWrapper and BigOptionButton outside")
