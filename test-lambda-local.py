#!/usr/bin/env python3
"""
Local Lambda Function Testing Script
Test Lambda functions locally before deploying to AWS
"""
import json
import sys
import os

# Add lambda function directories to path
sys.path.insert(0, 'lambda-functions/GenerateEmailLambda')
sys.path.insert(0, 'lambda-functions/SendCampaignLambda')
sys.path.insert(0, 'lambda-functions/ListCampaignsLambda')
sys.path.insert(0, 'lambda-functions/ConfigureCampaignLambda')

def print_header(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_response(response):
    print("\n📤 Response:")
    print(json.dumps(response, indent=2))

def test_generate_email():
    """Test the GenerateEmailLambda function"""
    print_header("Testing GenerateEmailLambda")
    
    try:
        from generate_email import lambda_handler
        
        event = {
            "body": json.dumps({
                "intent": "Cold outreach to CTOs about AI automation",
                "tone": "Professional",
                "count": 3
            })
        }
        
        print("\n📥 Request:")
        print(json.dumps(json.loads(event['body']), indent=2))
        
        response = lambda_handler(event, None)
        
        if response['statusCode'] == 200:
            body = json.loads(response['body'])
            print("\n✅ Success!")
            print(f"\n📧 Generated {len(body.get('variations', []))} email variations:")
            for i, var in enumerate(body.get('variations', []), 1):
                print(f"\n--- Variation {i} ---")
                print(f"Subject: {var.get('subject', 'N/A')}")
                print(f"Body: {var.get('body', 'N/A')[:100]}...")
        else:
            print(f"\n❌ Error: Status {response['statusCode']}")
            print_response(response)
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

def test_list_campaigns():
    """Test the ListCampaignsLambda function"""
    print_header("Testing ListCampaignsLambda")
    
    try:
        from list_campaigns import lambda_handler
        
        event = {}
        
        print("\n📥 Request: (empty - listing all campaigns)")
        
        response = lambda_handler(event, None)
        
        if response['statusCode'] == 200:
            body = json.loads(response['body'])
            campaigns = body.get('campaigns', [])
            print(f"\n✅ Success! Found {len(campaigns)} campaigns")
            
            for i, campaign in enumerate(campaigns[:3], 1):  # Show first 3
                print(f"\n--- Campaign {i} ---")
                print(f"ID: {campaign.get('campaignId', 'N/A')}")
                print(f"Name: {campaign.get('name', campaign.get('subject', 'N/A'))}")
                print(f"Status: {campaign.get('status', 'N/A')}")
                print(f"Recipients: {campaign.get('totalRecipients', 0)}")
        else:
            print(f"\n❌ Error: Status {response['statusCode']}")
            print_response(response)
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\nNote: This function requires AWS credentials and DynamoDB access.")
        print("It may not work locally without proper AWS configuration.")

def main():
    print("\n" + "=" * 60)
    print("🧪 Lambda Function Local Testing")
    print("=" * 60)
    
    print("\nAvailable tests:")
    print("1. Test GenerateEmailLambda (AI email generation)")
    print("2. Test ListCampaignsLambda (requires AWS credentials)")
    print("3. Run all tests")
    print("0. Exit")
    
    choice = input("\nEnter your choice (0-3): ").strip()
    
    if choice == "1":
        test_generate_email()
    elif choice == "2":
        test_list_campaigns()
    elif choice == "3":
        test_generate_email()
        test_list_campaigns()
    elif choice == "0":
        print("\n👋 Goodbye!")
        return
    else:
        print("\n❌ Invalid choice!")
        return
    
    print("\n" + "=" * 60)
    print("✅ Testing complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
