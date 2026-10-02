import sys
import re

with open('frontend/src/pages/NotificationsScreen.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure useToast is imported
if 'import { useToast } from' not in content:
    content = content.replace("import useAppStore from '../store/useAppStore';", "import useAppStore from '../store/useAppStore';\nimport { useToast } from '../hooks/useToast';")

# Make sure useToast is initialized
if 'const { addToast } = useToast();' not in content:
    content = content.replace("const [activeFilter, setActiveFilter] = useState('all');", "const { addToast } = useToast();\n  const [activeFilter, setActiveFilter] = useState('all');")

old_confirm = '''  const confirmDelete = async () => {
    if (!deleteAction) return;

    if (deleteAction.type === 'all') {
      await clearAllNotifications();
    } else if (deleteAction.type === 'single' && deleteAction.id) {
      await removeNotification(deleteAction.id);
    }
    setDeleteAction(null);
  };'''

new_confirm = '''  const confirmDelete = async () => {
    if (!deleteAction) return;

    if (deleteAction.type === 'all') {
      await clearAllNotifications();
      addToast('Todas las notificaciones borradas', 'success');
    } else if (deleteAction.type === 'single' && deleteAction.id) {
      await removeNotification(deleteAction.id);
      addToast('Notificación borrada', 'success');
    }
    setDeleteAction(null);
  };'''

content = content.replace(old_confirm, new_confirm)

with open('frontend/src/pages/NotificationsScreen.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done NotificationsScreen")
