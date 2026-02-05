import urllib.parse

url = "https://interon-email-images.s3.us-east-2.amazonaws.com/approved/default/pure-black.jpg"
parsed = urllib.parse.urlparse(url)
print(f"Path: {parsed.path}")
key = parsed.path.lstrip('/')
print(f"Key: {key}")

url2 = "https://s3.us-east-2.amazonaws.com/interon-email-images/approved/default/pure-black.jpg"
parsed2 = urllib.parse.urlparse(url2)
print(f"Path2: {parsed2.path}")
key2 = parsed2.path.lstrip('/')
print(f"Key2: {key2}")
