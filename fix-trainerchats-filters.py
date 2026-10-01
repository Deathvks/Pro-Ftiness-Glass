import sys

with open('frontend/src/components/TrainerChats.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

search_str = """            const activeClients = clients.filter(c => !c.is_chat_closed);
            const closedClients = clients.filter(c => c.is_chat_closed);"""

replace_str = """            const activeClients = clients.filter(c => !c.lastMessage?.is_closed);
            const closedClients = clients.filter(c => c.lastMessage?.is_closed);"""

content = content.replace(search_str, replace_str)

with open('frontend/src/components/TrainerChats.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing TrainerChats.jsx filters")
