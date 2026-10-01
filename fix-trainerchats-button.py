import sys

with open('frontend/src/components/TrainerChats.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

search_str = """  const [isResending, setIsResending] = useState(false);"""
replace_str = """  const [isResending, setIsResending] = useState(false);
  const [isExecutingBot, setIsExecutingBot] = useState(false);"""
content = content.replace(search_str, replace_str)

search_str2 = """  const executeBotReminder = async (e, client) => {
    e.stopPropagation();
    try {"""
replace_str2 = """  const executeBotReminder = async (e, client) => {
    e.stopPropagation();
    if (isExecutingBot) return;
    setIsExecutingBot(true);
    try {"""
content = content.replace(search_str2, replace_str2)

search_str3 = """      // Refresh chat list to update level
      fetchClients();
    } catch (error) {
      console.error(error);
      addToast('Error al enviar el aviso', 'error');
    }
  };"""
replace_str3 = """      // Refresh chat list to update level
      fetchClients();
    } catch (error) {
      console.error(error);
      addToast('Error al enviar el aviso', 'error');
    } finally {
      setIsExecutingBot(false);
    }
  };"""
content = content.replace(search_str3, replace_str3)

search_str4 = """                {(botModalClient.lastMessage?.bot_reminder_level || 0) < 3 && (
                  <button 
                    onClick={(e) => {
                      executeBotReminder(e, botModalClient);
                    }}
                    className="flex-1 py-3.5 bg-accent text-accent-contrast rounded-[16px] font-bold shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >"""
replace_str4 = """                {(botModalClient.lastMessage?.bot_reminder_level || 0) < 3 && (
                  <button 
                    disabled={isExecutingBot}
                    onClick={(e) => {
                      executeBotReminder(e, botModalClient);
                    }}
                    className="flex-1 py-3.5 bg-accent text-accent-contrast rounded-[16px] font-bold shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >"""
content = content.replace(search_str4, replace_str4)

with open('frontend/src/components/TrainerChats.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done patching TrainerChats.jsx")
