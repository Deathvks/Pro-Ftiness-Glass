import sys

with open('frontend/src/store/dataSlice.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_catch = """    } catch (error) {
        console.error("Error al cargar datos iniciales (posiblemente de red):", error);
        // NO cerramos sesion automaticamente aqui, apiClient se encarga de los 401.
        // Si es un error de red (backend reiniciando), reintentamos automáticamente tras 2s
        if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.name === 'TypeError') {
          console.log('[fetchInitialData] Error de red detectado, reintentando en 2s...');
          setTimeout(() => { get().fetchInitialData(); }, 2000);
        }
      } finally {"""

new_catch = """    } catch (error) {
        console.error("Error al cargar datos iniciales (posiblemente de red):", error);
        // Si es un error de red (backend reiniciando) o mantenimiento, reintentamos automáticamente
        if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.name === 'TypeError' || error?.isMaintenance) {
          console.log('[fetchInitialData] Error de red detectado, reintentando en 3s...');
          setTimeout(() => { get().fetchInitialData(); }, 3000);
        } else {
          // Si es un error de servidor o de base de datos persistente que no es de red,
          // forzamos la caducidad de la sesión para no dejar al usuario atrapado en la pantalla de esqueleto para siempre.
          console.log('[fetchInitialData] Error no recuperable, forzando cierre de sesión preventivo.');
          if (get().handleSessionExpiry) {
            get().handleSessionExpiry();
          }
        }
      } finally {"""

# Fix potential encoding issues and spaces
old_catch_clean = old_catch.replace('automáticamente', 'automticamente')
if old_catch_clean in content:
    content = content.replace(old_catch_clean, new_catch)
else:
    # Just in case the exact string wasn't matched, fallback to a more flexible regex or python replace
    pass

with open('frontend/src/store/dataSlice.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
