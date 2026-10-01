import sys

with open('mobile/src/app/onboarding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def replace_between(text, start_marker, end_marker, replacement):
    start_idx = text.find(start_marker)
    if start_idx == -1: return text
    end_idx = text.find(end_marker, start_idx + len(start_marker))
    if end_idx == -1: return text
    return text[:start_idx] + replacement + text[end_idx:]

edad_start = "TU EDAD</Text>\n              <View style={{ flexDirection: 'row'"
edad_end = "</View>\n            </View>\n          </StepWrapper>"
edad_new = """TU EDAD</Text>
              <GiantInput
                value={formData.age}
                onChangeText={(t: string) => setFormData({ ...formData, age: t.replace(/[^0-9]/g, '') })}
                keyboardType="numeric"
                placeholder="25"
                unit="a\u00f1os"
                colors={colors}
              />
"""

content = replace_between(content, edad_start, edad_end, edad_new)

altura_start = "ALTURA</Text>\n                </View>\n                <View style={{ flexDirection: 'row'"
altura_end = "</View>\n              </View>\n  \n              <View style={{ height: 1"
altura_new = """ALTURA</Text>
                </View>
                <GiantInput
                  value={formData.height}
                  onChangeText={(t: string) => setFormData({ ...formData, height: t.replace(/[^0-9]/g, '') })}
                  keyboardType="numeric"
                  placeholder="175"
                  unit="cm"
                  colors={colors}
                  autoFocus
                />
"""

content = replace_between(content, altura_start, altura_end, altura_new)

peso_start = "PESO ACTUAL</Text>\n                </View>\n                <View style={{ flexDirection: 'row'"
peso_end = "</View>\n              </View>\n            </View>\n          </StepWrapper>"
peso_new = """PESO ACTUAL</Text>
                </View>
                <GiantInput
                  value={formData.weight}
                  onChangeText={(t: string) => setFormData({ ...formData, weight: t.replace(',', '.').replace(/[^0-9.]/g, '') })}
                  keyboardType="decimal-pad"
                  placeholder="70.5"
                  unit="kg"
                  colors={colors}
                />
"""

content = replace_between(content, peso_start, peso_end, peso_new)

with open('mobile/src/app/onboarding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Properly replaced TextInputs with GiantInput")
