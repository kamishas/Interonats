
import os

file_path = r"c:\Users\Dell\OneDrive\Desktop\OneHR\05Dec2025_OneHR 2.0\05Dec2025_OneHR 2.0\src\components\client-detail-dashboard.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace API URL
content = content.replace("const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;", 
                          "const API_URL = (import.meta as any).env.VITE_CLIENT_API_URL || API_ENDPOINTS.CLIENT;")

# Replace Imports
if 'import { API_ENDPOINTS, getAccessToken } from "../lib/constants";' not in content:
    content = content.replace('import { projectId, publicAnonKey, } from "../utils/supabase/info";', 
                              'import { API_ENDPOINTS, getAccessToken } from "../lib/constants";')
    content = content.replace('import {\n  projectId,\n  publicAnonKey,\n} from "../utils/supabase/info";', 
                              'import { API_ENDPOINTS, getAccessToken } from "../lib/constants";')
    # Fallback for single line or other formatting
    content = content.replace('import { projectId, publicAnonKey } from "../utils/supabase/info";', 
                              'import { API_ENDPOINTS, getAccessToken } from "../lib/constants";')

# Replace Authorization Headers
content = content.replace("Authorization: `Bearer ${publicAnonKey}`", "Authorization: `Bearer ${getAccessToken()}`")
content = content.replace("Authorization: `Bearer ${publicAnonKey}`", "Authorization: `Bearer ${getAccessToken()}`") # Just in case

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done replacing in client-detail-dashboard.tsx")
