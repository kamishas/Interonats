import boto3
import time

def restore():
    client = boto3.client('lambda', region_name='us-east-2')
    func_name = 'EmailAgentUnified'
    
    print(f"Updating config for {func_name}...")
    
    try:
        response = client.update_function_configuration(
            FunctionName=func_name,
            Handler='lambda_function.lambda_handler',
            Environment={
                'Variables': {
                    'ZOHO_CLIENT_ID': '1000.4HO8UE25GRNFMF4NNMT31MW5T6D4HC',
                    'ZOHO_CLIENT_SECRET': '7523dc499deb78d76b88cd20771a509cbab00ce24b',
                    'SOURCE_EMAIL': 'admin@onehr.com',
                    'ZOHO_ACCOUNT_ID': 'primary'
                }
            }
        )
        print("Success! New Handler:", response['Handler'])
        print("Env Vars:", response['Environment']['Variables'])
    except Exception as e:
        print("Failed:", str(e))

if __name__ == '__main__':
    restore()
