import boto3

def get_db_info():
    ssm = boto3.client('ssm', region_name='us-east-2')
    params = ['/interonproducts/DB_HOST', '/interonproducts/DB_NAME']
    
    print("Fetching Database Connection Info...")
    try:
        response = ssm.get_parameters(Names=params, WithDecryption=True)
        found = {p['Name']: p['Value'] for p in response['Parameters']}
        
        host = found.get('/interonproducts/DB_HOST', 'Not Found')
        name = found.get('/interonproducts/DB_NAME', 'Not Found')
        
        print(f"Host: {host}")
        print(f"Database Name: {name}")
        
    except Exception as e:
        print(f"Error fetching parameters: {e}")

if __name__ == '__main__':
    get_db_info()
