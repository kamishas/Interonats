import boto3

def list_functions():
    client = boto3.client('lambda', region_name='us-east-2')
    paginator = client.get_paginator('list_functions')
    
    print("--- AWS Lambda Functions ---")
    for page in paginator.paginate():
        for func in page['Functions']:
            print(f"Name: {func['FunctionName']}")
            print(f"  Handler: {func['Handler']}")
            print(f"  LastModified: {func['LastModified']}")
            print("-" * 20)

if __name__ == '__main__':
    list_functions()
