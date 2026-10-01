import sys

with open('frontend/src/store/dataSlice.js', 'r', encoding='utf-8') as f:
    content = f.read()

# I will find the exact fetchInitialData catch block
search_str = """    } catch (error) {
        console.error("Error al cargar datos iniciales (posiblemente de red):", error);
        // NO cerramos sesion automaticamente aqui, apiClient se encarga de los 401.
        // Si es un error de red (backend reiniciando), reintentamos automticamente tras 2s
        if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.name === 'TypeError') {
          console.log('[fetchInitialData] Error de red detectado, reintentando en 2s...');
          setTimeout(() => { get().fetchInitialData(); }, 2000);
        }
      } finally {"""

replacement = """    } catch (error) {
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

# Since powershell/git might have different encodings, I'll use a safer find-replace.
# First, let's find the position of "Error al cargar datos iniciales"
idx = content.find('console.error("Error al cargar datos iniciales')
if idx != -1:
    start_idx = content.rfind('} catch (error) {', 0, idx)
    end_idx = content.find('} finally {', idx) + len('} finally {')
    
    if start_idx != -1 and end_idx != -1:
        old_block = content[start_idx:end_idx]
        content = content.replace(old_block, replacement)
        
        with open('frontend/src/store/dataSlice.js', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Done safe replace")
    else:
        print("Could not find bounds")
else:
    print("Could not find string")
