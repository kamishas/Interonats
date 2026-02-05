import boto3
import time

api_client = boto3.client('apigateway', region_name='us-east-2')

API_ID = '5cs5faz106'

def delete_resource():
    print("Searching for /util/verify-address to delete...")
    try:
        resources = api_client.get_resources(restApiId=API_ID)
        resource_id = None
        for item in resources['items']:
            if item.get('path') == '/util/verify-address':
                resource_id = item['id']
                break
        
        if resource_id:
            print(f"Deleting resource {resource_id}...")
            api_client.delete_resource(restApiId=API_ID, resourceId=resource_id)
            print("Resource deleted.")
            time.sleep(5) # Wait for propagation
        else:
            print("Resource not found.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    delete_resource()
