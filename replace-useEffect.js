const fs = require("fs");
let content = fs.readFileSync("frontend/src/components/TrainerChats.jsx", "utf8");

const regex = /useEffect\(\(\) => \{[\s\S]*?\}, \[clients\]\);/;

const replacement = `  useEffect(() => {
    if (botModalClient) {
      const updatedClient = clients.find(c => c.id === botModalClient.id);
      if (updatedClient) {
        const remindersChanged = JSON.stringify(updatedClient.botReminders) !== JSON.stringify(botModalClient.botReminders);
        if (updatedClient.lastMessage?.id !== botModalClient.lastMessage?.id || 
            updatedClient.lastMessage?.bot_push_status !== botModalClient.lastMessage?.bot_push_status || 
            updatedClient.lastMessage?.bot_email_status !== botModalClient.lastMessage?.bot_email_status ||
            remindersChanged) {
          setBotModalClient(updatedClient);
        }
      }
    }
  }, [clients]);`;

content = content.replace(regex, replacement);
fs.writeFileSync("frontend/src/components/TrainerChats.jsx", content);
console.log("Done");
