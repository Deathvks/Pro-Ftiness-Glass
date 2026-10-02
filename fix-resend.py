import sys
import re

with open('frontend/src/components/TrainerChats.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_resend = '''  const handleResendNotification = async () => {
    if (!resendConfirmData || isResending) return;
    setIsResending(true);
    try {
      const { client, level } = resendConfirmData;
      const res = await apiClient('/chat/trainer/bot-reminder-resend/' + client.id + '/' + level + '?type=' + resendConfirmData.type, { method: 'POST' });
      addToast('Reenvío completado con éxito', 'success');
      setResendConfirmData(null);
    } catch (e) {
      console.error(e);
      addToast('Error al reenviar notificaciones', 'error');
    } finally {
      setIsResending(false);
    }
  };'''

new_resend = '''  const handleResendNotification = async () => {
    if (!resendConfirmData || isResending) return;
    setIsResending(true);
    try {
      const { client, level, type } = resendConfirmData;
      const res = await apiClient('/chat/trainer/bot-reminder-resend/' + client.id + '/' + level + '?type=' + type, { method: 'POST' });
      
      // Update local state so it immediately says "Enviado Manualmente"
      setClients(prev => prev.map(c => {
        if (c.id === client.id) {
          const updated = { ...c };
          if (!updated.botReminders) updated.botReminders = [];
          
          let existing = updated.botReminders.find(m => m.bot_reminder_level === level);
          if (!existing) {
             existing = { bot_reminder_level: level };
             updated.botReminders.push(existing);
          }
          
          if (type === 'push') existing.bot_push_status = 'manual_ok';
          if (type === 'email') existing.bot_email_status = 'manual_ok';
          
          if (updated.lastMessage?.bot_reminder_level === level) {
             if (type === 'push') updated.lastMessage.bot_push_status = 'manual_ok';
             if (type === 'email') updated.lastMessage.bot_email_status = 'manual_ok';
          }
          return updated;
        }
        return c;
      }));

      addToast('Reenvío completado con éxito', 'success');
      setResendConfirmData(null);
    } catch (e) {
      console.error(e);
      addToast('Error al reenviar notificaciones', 'error');
    } finally {
      setIsResending(false);
    }
  };'''

content = content.replace(old_resend, new_resend)

with open('frontend/src/components/TrainerChats.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done Handle Resend")
