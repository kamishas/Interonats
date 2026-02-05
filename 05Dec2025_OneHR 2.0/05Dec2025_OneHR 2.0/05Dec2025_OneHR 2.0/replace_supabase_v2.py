
import os
import re

file_path = r"c:\Users\Dell\OneDrive\Desktop\OneHR\05Dec2025_OneHR 2.0\05Dec2025_OneHR 2.0\src\components\client-detail-dashboard.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Quoted Authorization Headers
content = content.replace("'Authorization': `Bearer ${publicAnonKey}`", "'Authorization': `Bearer ${getAccessToken()}`")
content = content.replace('"Authorization": `Bearer ${publicAnonKey}`', '"Authorization": `Bearer ${getAccessToken()}`')

# Replace Unquoted (just in case I missed any variants)
content = content.replace("Authorization: `Bearer ${publicAnonKey}`", "Authorization: `Bearer ${getAccessToken()}`")

# Check globally for any remaining usage
if "publicAnonKey" in content:
    print("Warning: publicAnonKey still found in file!")
    # Print line numbers
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if "publicAnonKey" in line:
            print(f"Line {i+1}: {line.strip()}")
            # Attempt to brute-force replace if it's a simple variable substitution
            if "${publicAnonKey}" in line:
                lines[i] = line.replace("${publicAnonKey}", "${getAccessToken()}")
                print(f"Brute-force replaced Line {i+1}")
    
    content = '\n'.join(lines)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done replacing in client-detail-dashboard.tsx")
