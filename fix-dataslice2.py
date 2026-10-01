import sys
import re

with open('frontend/src/store/dataSlice.js', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'\} catch \(error\) \{[\s\S]*?\} finally \{')
replacement = """} catch (error) {
        console.error("Error al cargar datos iniciales (posiblemente de red):", error);
        if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.name === 'TypeError' || error?.isMaintenance) {
          console.log('[fetchInitialData] Error de red detectado, reintentando en 3s...');
          setTimeout(() => { get().fetchInitialData(); }, 3000);
        } else {
          console.log('[fetchInitialData] Error no recuperable, forzando cierre de sesión preventivo.');
          if (get().handleSessionExpiry) {
            get().handleSessionExpiry();
          }
        }
      } finally {"""

content = pattern.sub(replacement, content, count=1)

with open('frontend/src/store/dataSlice.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
