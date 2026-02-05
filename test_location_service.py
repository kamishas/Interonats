
import json
import os
import sys

# Set environment variables for testing
os.environ['AWS_REGION'] = 'us-east-1'
os.environ['PLACE_INDEX_NAME'] = 'InteronAddressIndex'
# Credentials must be set in the shell running this script, or we can assume they are passed via Env vars

# Import the lambda function
sys.path.append(os.path.join(os.getcwd(), 'lambda-functions', 'AddressVerificationLambda'))
from lambda_function import lambda_handler

def test_autocomplete():
    print("Testing Autocomplete...")
    event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'action': 'autocomplete',
            'query': '1600 Amphitheatre Pkwy' # Google HQ, should be known
        })
    }
    context = {}
    
    response = lambda_handler(event, context)
    print("Response Status:", response['statusCode'])
    body = json.loads(response['body'])
    print("Suggestions found:", len(body.get('suggestions', [])))
    if body.get('suggestions'):
        print("First suggestion:", body['suggestions'][0]['label'])
    else:
        print("Body:", body)
        
def test_verify():
    print("\nTesting Verification...")
    event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'action': 'verify',
            'street': '1600 Amphitheatre Pkwy',
            'city': 'Mountain View',
            'state': 'CA', 
            'zip': '94043'
        })
    }
    context = {}
    
    response = lambda_handler(event, context)
    print("Response Status:", response['statusCode'])
    body = json.loads(response['body'])
    print("Valid:", body.get('isValid'))
    print("Message:", body.get('message'))
    print("Standardized:", body.get('standardized'))

if __name__ == "__main__":
    try:
        test_autocomplete()
        test_verify()
    except Exception as e:
        print(f"Test Failed: {e}")
