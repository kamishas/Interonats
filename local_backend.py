
import http.server
import socketserver
import json
import os
import sys

# Import the lambda function
sys.path.append(os.path.join(os.getcwd(), 'lambda-functions', 'AddressVerificationLambda'))
from lambda_function import lambda_handler

PORT = 8000

class LambdaRequestHandler(http.server.BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data.decode('utf-8'))
        except json.JSONDecodeError:
            body = {}

        # Construct a mock event
        event = {
            'httpMethod': 'POST',
            'body': json.dumps(body) # lambda_handler expects body as string
        }
        context = {}

        print(f"Request: {body.get('action', 'verify')} - {body.get('query') or body.get('street')}")

        try:
            # Invoke the Lambda handler
            response = lambda_handler(event, context)
            
            # Parse response
            status_code = response.get('statusCode', 200)
            response_body = response.get('body', '{}')
            
            self._set_headers(status=status_code)
            self.wfile.write(response_body.encode('utf-8'))
            
        except Exception as e:
            print(f"Error executing lambda: {e}")
            self._set_headers(status=500)
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

def run(server_class=http.server.HTTPServer, handler_class=LambdaRequestHandler, port=PORT):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting local backend server on port {port}...")
    print("Serving Address Verification Lambda...")
    
    # Ensure environment variables are set (can be set before running script or hardcoded here if needed)
    # They should be set in the shell
    if not os.environ.get('AWS_ACCESS_KEY_ID'):
        print("WARNING: AWS Credentials not found in environment!")
    
    httpd.serve_forever()

if __name__ == "__main__":
    run()
