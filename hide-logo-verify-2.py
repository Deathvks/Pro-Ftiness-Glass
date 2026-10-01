import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    start_idx = -1
    for i, line in enumerate(lines):
        if 'logo.webp' in line:
            for j in range(i, max(-1, i-5), -1):
                if '<Image' in lines[j]:
                    start_idx = j
                    break
            break
            
    if start_idx == -1:
        print(f"Could not find logo in {filepath}")
        return
        
    end_idx = -1
    for i in range(start_idx, len(lines)):
        if 'GRATIS Y SIN ANUNCIOS' in lines[i]:
            for j in range(i, i+10):
                if '</View>' in lines[j] and '</BlurView>' in lines[j-1]:
                    end_idx = j
                    break
            break
            
    if end_idx == -1:
        print(f"Could not find end of badge in {filepath}")
        return
        
    # Prevent double patching
    if "{!needsVerification" in lines[start_idx-1]:
        print(f"Already patched {filepath}")
        return

    lines.insert(end_idx + 1, "            </>\n          )}\n")
    lines.insert(start_idx, "          {!needsVerification && (\n            <>\n")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f"Successfully patched {filepath}")

patch_file('mobile/src/app/register.tsx')
