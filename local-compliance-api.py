#!/usr/bin/env python3
"""
Local Mock Compliance API Server
Runs on localhost:5000 for testing without deploying to AWS
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import re

app = Flask(__name__)
# Allow ALL CORS - all origins, methods, and headers
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"], "allow_headers": "*"}})

# Compliance patterns (same as Lambda)
VISA_PATTERNS = [
    r'\bh-?1b?\b', r'\bh1b\b', r'\bopt\b', r'\bcpt\b', r'\bgc\b', 
    r'\bgreen\s*card\b', r'\bcitizen(s|ship)?\b', 
    r'\bvisa\s+(sponsorship|status|required|preferred|available|restriction)\b',
    r'\bwork\s+authorization\b', r'\bimmigration\s+status\b',
    r'\bno\s+visa\s+restriction\b', r'\bvisa\s+restriction\b',
    r'\bvisa\s+requirements?\b', r'\bwork\s+permit\b',
    r'\bauthorized\s+to\s+work\b', r'\beligible\s+to\s+work\b',
]

BENCH_PATTERNS = [
    r'\bbench\s+(sales|recruiting|list|candidate|employee)\b',
    r'\bavailable\s+candidate\s+details\b',
    r'\bbenched\s+employee\b',
]

DISCRIMINATORY_PATTERNS = [
    r'\bh1\s+only\b', r'\bopt\s+preferred\b', r'\bno\s+cpt\b',
    r'\bmust\s+have\s+(gc|citizenship|green\s*card)\b',
]

def check_text_compliance(text):
    violations = []
    text_lower = text.lower()
    
    # Check visa patterns
    for pattern in VISA_PATTERNS:
        matches = re.finditer(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            violations.append({
                'type': 'VISA_RESTRICTION',
                'severity': 'HIGH',
                'text': match.group(),
                'position': match.span(),
                'message': 'Visa-related content detected. Remove references to visa status.'
            })
    
    # Check bench patterns
    for pattern in BENCH_PATTERNS:
        matches = re.finditer(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            violations.append({
                'type': 'BENCH_CONTENT',
                'severity': 'CRITICAL',
                'text': match.group(),
                'position': match.span(),
                'message': 'Bench-related terminology detected. This violates H-1B regulations.'
            })
    
    # Check discriminatory patterns
    for pattern in DISCRIMINATORY_PATTERNS:
        matches = re.finditer(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            violations.append({
                'type': 'DISCRIMINATORY',
                'severity': 'CRITICAL',
                'text': match.group(),
                'position': match.span(),
                'message': 'Discriminatory language detected. This violates EEOC guidelines.'
            })
    
    return len(violations) == 0, violations

@app.route('/compliance/check', methods=['POST', 'OPTIONS'])
def check_compliance():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', '*')
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response, 200
    
    data = request.json
    subject = data.get('subject', '')
    body = data.get('body', '')
    
    all_violations = []
    
    # Check subject
    subject_compliant, subject_violations = check_text_compliance(subject)
    all_violations.extend([{**v, 'location': 'subject'} for v in subject_violations])
    
    # Check body
    body_compliant, body_violations = check_text_compliance(body)
    all_violations.extend([{**v, 'location': 'body'} for v in body_violations])
    
    is_compliant = len(all_violations) == 0
    
    # Generate suggestions
    suggestions = []
    if not is_compliant:
        violation_types = set(v['type'] for v in all_violations)
        
        if 'VISA_RESTRICTION' in violation_types:
            suggestions.append("✓ Remove all visa status references (H1B, OPT, CPT, GC, citizenship)")
        if 'BENCH_CONTENT' in violation_types:
            suggestions.append("✓ Remove bench-related terminology immediately")
        if 'DISCRIMINATORY' in violation_types:
            suggestions.append("✓ Remove discriminatory language - focus on job requirements only")
        
        suggestions.append("✓ Use inclusive, non-discriminatory language")
    
    response = jsonify({
        'isCompliant': is_compliant,
        'violations': all_violations,
        'suggestions': suggestions,
        'summary': {
            'total': len(all_violations),
            'critical': len([v for v in all_violations if v['severity'] == 'CRITICAL']),
            'high': len([v for v in all_violations if v['severity'] == 'HIGH']),
            'warning': 0
        }
    })
    
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', '*')
    response.headers.add('Access-Control-Allow-Headers', '*')
    
    return response

@app.route('/images/upload', methods=['POST', 'OPTIONS'])
def upload_image():
    """Mock image upload endpoint for local testing"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', '*')
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response, 200
    
    try:
        data = request.json
        image_data = data.get('image')  # base64 encoded
        filename = data.get('filename', 'image.jpg')
        
        if not image_data:
            response = jsonify({'error': 'No image data provided'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 400
        
        # For local testing, just return a mock URL
        # In production, this would upload to S3 and check compliance with Claude Vision
        mock_url = f"http://localhost:5000/uploads/{filename}"
        
        print(f"📸 Image upload: {filename} ({len(image_data)} bytes)")
        print(f"   Mock URL: {mock_url}")
        
        response = jsonify({
            'url': mock_url,
            'filename': filename,
            'message': 'Image uploaded successfully (mock - local testing)'
        })
        
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', '*')
        response.headers.add('Access-Control-Allow-Headers', '*')
        
        return response, 200
        
    except Exception as e:
        print(f"Error uploading image: {str(e)}")
        response = jsonify({'error': str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

if __name__ == '__main__':
    print("=" * 60)
    print("🛡️  Local Compliance API Server")
    print("=" * 60)
    print("Running on: http://localhost:5000")
    print()
    print("Endpoints:")
    print("  POST /compliance/check  - Check text compliance")
    print("  POST /images/upload     - Upload images (mock)")
    print("=" * 60)
    app.run(host='127.0.0.1', port=5000, debug=True)
