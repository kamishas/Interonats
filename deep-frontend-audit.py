import os
import json

print("="*80)
print("DEEP FRONTEND AUDIT")
print("="*80)

# 1. Check if backend integration is enabled
print("\n1. CHECKING CampaignContext.tsx")
print("-"*80)

context_path = r'c:\Users\kamin\Downloads\Interon\Emails Agent\Interon AI Email Agent\src\context\CampaignContext.tsx'
with open(context_path, 'r', encoding='utf-8') as f:
    context_content = f.read()

if 'apiClient.post' in context_content:
    print("✅ Backend API calls ENABLED")
    print("   Found: apiClient.post calls")
else:
    print("❌ Backend API calls DISABLED")
    print("   Using local-only mode")

# 2. Check API configuration
print("\n2. CHECKING api.js")
print("-"*80)

api_path = r'c:\Users\kamin\Downloads\Interon\Emails Agent\Interon AI Email Agent\src\config\api.js'
with open(api_path, 'r', encoding='utf-8') as f:
    api_content = f.read()

import re
api_base = re.search(r"const API_BASE_URL = '([^']+)'", api_content)
if api_base:
    print(f"✅ API_BASE_URL: {api_base.group(1)}")
    if '5tdsq6s7h3' in api_base.group(1):
        print("   ✅ Correct API Gateway ID")
    else:
        print("   ❌ Wrong API Gateway ID")
else:
    print("❌ API_BASE_URL not found")

# Check for /contacts/tags endpoint
if '/contacts/tags' in api_content:
    print("✅ /contacts/tags endpoint defined")
else:
    print("❌ /contacts/tags endpoint NOT defined")

# 3. Check what files are in build directory
print("\n3. CHECKING BUILD DIRECTORY")
print("-"*80)

build_path = r'c:\Users\kamin\Downloads\Interon\Emails Agent\Interon AI Email Agent\build'
if os.path.exists(build_path):
    files = os.listdir(build_path)
    print(f"✅ Build directory exists")
    print(f"   Files: {len(files)}")
    
    # Check if index.html exists
    if 'index.html' in files:
        print("   ✅ index.html exists")
    
    # Check assets
    if 'assets' in files:
        assets = os.listdir(os.path.join(build_path, 'assets'))
        print(f"   ✅ Assets: {len(assets)} files")
else:
    print("❌ Build directory doesn't exist")

# 4. Check last build time
print("\n4. CHECKING LAST BUILD TIME")
print("-"*80)

if os.path.exists(build_path):
    index_path = os.path.join(build_path, 'index.html')
    if os.path.exists(index_path):
        import datetime
        mtime = os.path.getmtime(index_path)
        build_time = datetime.datetime.fromtimestamp(mtime)
        now = datetime.datetime.now()
        age = now - build_time
        
        print(f"Last build: {build_time}")
        print(f"Age: {age}")
        
        if age.total_seconds() < 600:  # Less than 10 minutes
            print("✅ Recent build (< 10 minutes)")
        else:
            print("⚠️  Old build - may need to rebuild")

print("\n" + "="*80)
print("AUDIT COMPLETE")
print("="*80)
