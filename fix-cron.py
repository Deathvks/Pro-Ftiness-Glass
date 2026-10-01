import sys
import re

with open('backend/services/cronService.js', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace cron.schedule('0 11 * * *', async () => {
# with cron.schedule('0 11 * * *', async () => { ... }, { timezone: "Europe/Madrid" });

# First, find the checkChatBotReminders block
old_schedule = "cron.schedule('0 11 * * *', async () => {"
new_schedule = "cron.schedule('0 11 * * *', async () => {"

# We need to find where this block ends.
# It ends with:
#      } catch(err) {
#        console.error('[Cron] Error bot de chats:', err.message);
#      }
#    });
#  };

# Let's just replace the exact end of that block.
block_end_old = """      } catch(err) {
        console.error('[Cron] Error bot de chats:', err.message);
      }
    });
  };"""

block_end_new = """      } catch(err) {
        console.error('[Cron] Error bot de chats:', err.message);
      }
    }, {
      timezone: "Europe/Madrid"
    });
  };"""

content = content.replace(block_end_old, block_end_new)

with open('backend/services/cronService.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
