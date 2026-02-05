import json
import re
import boto3
from typing import Dict, List, Tuple

# Initialize Bedrock client
bedrock = boto3.client('bedrock-runtime', region_name='us-east-2')

# Fast, strict compliance patterns
VISA_PATTERNS = [
    r'\bh-?1b?\b', r'\bh1b\b', r'\bopt\b', r'\bcpt\b', r'\bgc\b', 
    r'\bgreen\s*card\b', r'\bcitizen(s|ship)?\b', 
    r'\bvisa\s+(sponsorship|status|required|preferred|available|restriction)\b',
    r'\bwork\s+authorization\b', r'\bimmigration\s+status\b',
    r'\bno\s+visa\s+restriction\b', r'\bvisa\s+restriction\b',
    r'\bvisa\s+requirements?\b', r'\bwork\s+permit\b',
    r'\bauthorized\s+to\s+work\b', r'\beligible\s+to\s+work\b',
    r'\bh-?4\b', r'\bl-?1\b', r'\bead\b', r'\buscis\b'
]

BENCH_PATTERNS = [
    r'\bbench\s+(sales|recruiting|list|candidate|employee)\b',
    r'\bavailable\s+candidate\s+details\b',
    r'\bbenched\s+employee\b',
    r'\bbench\s+marketing\b',
    r'\bbench\s+resource\b'
]

DISCRIMINATORY_PATTERNS = [
    r'\bh1\s+only\b', r'\bopt\s+preferred\b', r'\bno\s+cpt\b',
    r'\bmust\s+have\s+(gc|citizenship|green\s*card)\b',
    r'\buscis\s+required\b', r'\bno\s+visa\s+sponsorship\b'
]

def check_text_compliance(text: str) -> Tuple[bool, List[Dict]]:
    """
    Fast pattern-based compliance check
    Returns: (is_compliant, violations_list)
    """
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
                'message': 'Visa-related content detected. Remove references to visa status, work authorization, or citizenship requirements.'
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
                'message': 'Bench-related terminology detected. This violates H-1B regulations and must be removed.'
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
    
    is_compliant = len(violations) == 0
    return is_compliant, violations

def check_with_ai(text: str) -> Tuple[bool, List[Dict]]:
    """
    Use Claude 3.5 Sonnet for intelligent compliance analysis
    Catches typos, variations, and obfuscated terms
    """
    try:
        # Explicit, strict prompt
        prompt = f"""You are an EEOC compliance checker. Analyze this email text and flag ANY mention of immigration status, visa requirements, or citizenship.

Email text:
\"\"\"{text}\"\"\"

FLAG AS VIOLATION if you find:
- Words like: citizen, citizens, citizenship, green card, GC, H1B, H-1B, OPT, CPT, visa, work authorization, EAD, USCIS, immigration status
- Typos or variations: "citizenasdas", "h1bs", "gc holders", "work auth"
- Indirect references: "only for gc", "must have authorization", "no visa sponsorship"

Respond in JSON:
{{
  "violations": [
    {{
      "type": "VISA_RESTRICTION",
      "text": "exact text found",
      "severity": "CRITICAL",
      "reason": "explanation"
    }}
  ]
}}

If NO violations: {{"violations": []}}

BE STRICT - flag "citizens" as a violation."""

        request = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 500,
            "temperature": 0.0,
            "messages": [{
                "role": "user",
                "content": [{"type": "text", "text": prompt}]
            }]
        }
        
        # Use Claude 3.5 Sonnet (more reliable than Haiku)
        response = bedrock.invoke_model(
            modelId="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            body=json.dumps(request)
        )
        
        result = json.loads(response['body'].read())
        response_text = result['content'][0]['text'].strip()
        
        print(f"AI Response: {response_text}")
        
        # Parse JSON
        try:
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                ai_result = json.loads(json_match.group())
            else:
                ai_result = json.loads(response_text)
            
            violations = ai_result.get('violations', [])
            
            formatted_violations = []
            for v in violations:
                formatted_violations.append({
                    'type': v.get('type', 'VISA_RESTRICTION'),
                    'severity': v.get('severity', 'CRITICAL'),
                    'text': v.get('text', ''),
                    'message': v.get('reason', f"AI detected {v.get('type', 'compliance')} violation"),
                    'source': 'AI'
                })
            
            print(f"Formatted violations: {formatted_violations}")
            return len(formatted_violations) == 0, formatted_violations
            
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"JSON parse error: {e}, Response: {response_text}")
            return True, []
            
    except Exception as e:
        print(f"AI check error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return True, []

def lambda_handler(event, context):
    """
    AI-powered compliance checker with intelligent typo detection
    Always uses Claude 3 Haiku for fast, accurate scanning
    
    Input:
    {
        "subject": "Email subject",
        "body": "Email body text"
    }
    
    Output:
    {
        "isCompliant": true/false,
        "violations": [...],
        "suggestions": [...]
    }
    """
    try:
        body = json.loads(event.get('body', '{}'))
        
        subject = body.get('subject', '')
        email_body = body.get('body', '')
        
        all_violations = []
        
        # Always use AI for intelligent detection (catches typos like "citizenasdas")
        full_text = f"Subject: {subject}\n\nBody: {email_body}"
        ai_compliant, ai_violations = check_with_ai(full_text)
        all_violations.extend([{**v, 'location': 'email'} for v in ai_violations])
        
        is_compliant = len(all_violations) == 0
        
        # Generate actionable suggestions
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
            suggestions.append("✓ Focus on skills and qualifications, not immigration status")
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps({
                'isCompliant': is_compliant,
                'violations': all_violations,
                'suggestions': suggestions,
                'summary': {
                    'total': len(all_violations),
                    'critical': len([v for v in all_violations if v['severity'] == 'CRITICAL']),
                    'high': len([v for v in all_violations if v['severity'] == 'HIGH']),
                    'warning': len([v for v in all_violations if v['severity'] == 'WARNING'])
                },
                'scanType': 'AI (Claude 3 Haiku)'
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps({'error': str(e)})
        }
