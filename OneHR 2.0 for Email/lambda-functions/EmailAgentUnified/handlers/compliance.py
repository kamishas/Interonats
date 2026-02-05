import json
import boto3
import os

# Initialize Bedrock client
def check_text_compliance(event, context):
    try:
        # Initialize Bedrock client (Lazy load to prevent cold start crashes)
        bedrock = boto3.client(service_name='bedrock-runtime', region_name='us-east-2')

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Combine subject and body for analysis
        subject = body.get('subject', '')
        email_body = body.get('body', '')
        text = body.get('text', '') # Legacy support
        
        full_text = text if text else f"Subject: {subject}\n\nBody: {email_body}"
        
        if not full_text:
             return {'statusCode': 400, 'body': json.dumps({'error': 'Compliance Check Failed: Subject and Body are both empty.'})}
             
        # --- LEVEL 1: REGEX PRE-CHECK (Strict Keyword Enforcement) ---
        # Immediate fail for known prohibited terms
        import re
        
        # 1. Visa / Immigration
        visa_patterns = [
            r'\b(h1b?|opt|cpt|gc|green\s*card|usc)\b', # Targeted visa types
            r'(visa\s*sponsorship)',
            r'(citizens\s*only)',
            r'(valid\s*visa)',
            r'(no\s*cpt)'
        ]
        
        # 2. Bench Sales
        bench_patterns = [
            r'(bench\s*sales)',
            r'(bench\s*recruiting)',
            r'(bench\s*consultant)',
            r'(hot\s*list)',
            r'(available\s*candidate)'
        ]
        
        pre_check_violations = []
        
        for pattern in visa_patterns:
            if re.search(pattern, full_text, re.IGNORECASE):
                pre_check_violations.append("Strict Violation: Visa/Immigration restrictions detected (e.g., H1B, OPT, CPT).")
                break # One is enough to fail
                
        for pattern in bench_patterns:
            if re.search(pattern, full_text, re.IGNORECASE):
                pre_check_violations.append("Strict Violation: Bench Sales/Recruiting terminology detected.")
                break
                
        # If Regex fails, return immediately (Save cost/latency + Guarantee strictness)
        if pre_check_violations:
            return {
                'statusCode': 200, 
                'body': json.dumps({
                    "isCompliant": False,
                    "violations": [{"message": v} for v in pre_check_violations],
                    "suggestions": "Please remove all references to specific visa types, immigration status, or bench sales terminology."
                })
            }

        # --- LEVEL 2: AI CHECK (Contextual & EEOC) ---
        # Only call Bedrock if regex passes (for nuances like "young energetic team" -> Ageism)
        
        # Call Bedrock
        prompt = f"""
        You are an expert HR compliance officer. Analyze the following email text for strict compliance with EEOC, Immigration, and Bench Sales regulations.
        
        TEXT:
        "{full_text}"
        
        STRICT RULES:
        1. EEOC (Federal): No discrimination based on race, color, religion, sex, national origin, age, disability, or genetic information.
        2. VISA / IMMIGRATION (Strictly Forbidden): 
           - DO NOT mention "H1 only", "H1B only", "OPT preferred", "No CPT", "GC", "Green Card", "Citizens only", "USC only".
           - DO NOT use phrases like "visa sponsorship available" or "must have valid visa".
           - ANY mention of visa status, requirements, or exclusions is a VIOLATION.
        3. BENCH SALES / RECRUITING (Strictly Forbidden):
           - DO NOT use terms like "Bench Sales", "Bench Recruiting", "Bench Consultant", "Hotlist", "Available Candidates".
           - DO NOT market lists of consultants or resumes.
        
        INSTRUCTIONS:
        1. If ANY violation from the above categories is found, the text is NON-COMPLIANT.
        2. List specific violations clearly (e.g., "Visa restriction mentioned: 'H1 only'").
        3. If no issues are found, state "No compliance issues detected."
        
        RESPONSE FORMAT (JSON):
        {{
            "compliant": boolean,
            "issues": [list of strings],
            "suggestions": string
        }}
        """
        
        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        response = bedrock.invoke_model(
            modelId='us.anthropic.claude-3-5-haiku-20241022-v1:0', # Use Inference Profile for cross-region
            body=json.dumps(payload)
        )
        
        result_body = json.loads(response['body'].read())
        content = result_body['content'][0]['text']
        
        # Parse JSON from LLM response (handling potential markdown wrapping)
        json_str = content
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0]
        elif "{" in content:
             start = content.find("{")
             end = content.rfind("}") + 1
             json_str = content[start:end]
             
        try:
            analysis = json.loads(json_str)
        except:
            # Fallback if LLM output isn't perfect JSON
            analysis = {
                "compliant": "No compliance issues" in content,
                "issues": [],
                "suggestions": content
            }
        
        # Transform to frontend expected format
        # Frontend expects: { isCompliant: bool, violations: [{ message: string }] }
        response_data = {
            "isCompliant": analysis.get("compliant", False),
            "violations": [{"message": issue} for issue in analysis.get("issues", [])],
            "suggestions": analysis.get("suggestions", "")
        }
            
        return {'statusCode': 200, 'body': json.dumps(response_data)}
        
    except Exception as e:
        print(f"Compliance Check Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
