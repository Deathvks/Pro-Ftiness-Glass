import sys

with open('backend/server.js', 'r', encoding='utf-8') as f:
    content = f.read()

search_str = """  } catch (err) {
    console.error('Socket error: Invalid token for socket', socket.id, err.message);
    return next(new Error('Authentication error: Invalid token'));
  }"""

replace_str = """  } catch (err) {
    if (!err.message.includes('jwt expired')) {
      console.error('Socket error: Invalid token for socket', socket.id, err.message);
    }
    return next(new Error('Authentication error: Invalid token'));
  }"""

content = content.replace(search_str, replace_str)

with open('backend/server.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing socket logs")
