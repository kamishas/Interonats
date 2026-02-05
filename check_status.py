import boto3
def check():
    client = boto3.client('lambda', region_name='us-east-2')
    resp = client.get_function(FunctionName='onehr-login-api')
    print(resp['Configuration']['LastUpdateStatus'])

if __name__ == '__main__':
    check()
