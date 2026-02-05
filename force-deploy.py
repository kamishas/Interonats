import boto3
import time

API_ID = '5cs5faz106'
REGION = 'us-east-2'

client = boto3.client('apigateway', region_name=REGION)

def deploy():
    print(f"Deploying API {API_ID} to 'prod'...")
    try:
        dep = client.create_deployment(
            restApiId=API_ID,
            stageName='prod',
            description='Force deploy after route fix'
        )
        print(f"✅ Deployment Successful. ID: {dep['id']}")
    except Exception as e:
        print(f"❌ Deployment Failed: {e}")

if __name__ == "__main__":
    deploy()
