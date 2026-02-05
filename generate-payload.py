import json
import base64

image_path = r"C:\Users\kamin\Downloads\Interon\Emails Agent\Test data\1668198287318.jpg"

with open(image_path, "rb") as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

payload = {
    "body": json.dumps({
        "image": image_data,
        "filename": "debug_real.jpg",
        "campaignId": "debug"
    }),
    "httpMethod": "POST"
}

with open("real-payload.json", "w") as f:
    json.dump(payload, f)

print("Created real-payload.json")
