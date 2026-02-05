#!/usr/bin/env python3
"""
Local Development Server for Interon AI Email Agent
Serves the compiled frontend on http://localhost:3000
"""
import http.server
import socketserver
import os
import sys

PORT = 3000
DIRECTORY = "frontend"

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # Custom logging format
        sys.stdout.write("%s - [%s] %s\n" %
                         (self.address_string(),
                          self.log_date_time_string(),
                          format % args))

def main():
    # Check if frontend directory exists
    if not os.path.exists(DIRECTORY):
        print(f"Error: '{DIRECTORY}' directory not found!")
        print(f"Please run this script from the project root directory.")
        sys.exit(1)
    
    # Create server
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print("=" * 60)
        print("🚀 Interon AI Email Agent - Local Development Server")
        print("=" * 60)
        print(f"📂 Serving files from: {os.path.abspath(DIRECTORY)}")
        print(f"🌐 Server running at: http://localhost:{PORT}/")
        print(f"📱 Open in browser: http://localhost:{PORT}/index.html")
        print("=" * 60)
        print("Press Ctrl+C to stop the server")
        print("=" * 60)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped. Goodbye!")
            sys.exit(0)

if __name__ == "__main__":
    main()
