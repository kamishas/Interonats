import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

# User's Consumer Key (Trying it as the Legacy User ID)
USER_ID = 'dCeWPspWze4SR3iXtOf7KlW9FkgLGFYBT8k16NHDaEnMKqUC'

def test_legacy():
    print("Testing Legacy USPS Web Tools API...")
    
    # Construct XML Request
    xml = f"""
    <AddressValidateRequest USERID="{USER_ID}">
        <Revision>1</Revision>
        <Address ID="0">
            <Address1></Address1>
            <Address2>4313 RAMONA DR</Address2>
            <City>FAIRFAX</City>
            <State>VA</State>
            <Zip5>22030</Zip5>
            <Zip4></Zip4>
        </Address>
    </AddressValidateRequest>
    """
    
    # URL Encode XML
    query = urllib.parse.urlencode({'API': 'Verify', 'XML': xml})
    url = f"https://secure.shippingapis.com/ShippingAPI.dll?{query}"
    
    print(f"URL: {url}")
    
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read().decode('utf-8')
            print("Response:")
            print(data)
            
            # Simple check
            if "Error" in data:
                print("FAILURE: API returned Error.")
            elif "AddressValidateResponse" in data:
                print("SUCCESS: Valid Response received.")
                
    except Exception as e:
        print(f"HTTP Error: {e}")

if __name__ == "__main__":
    test_legacy()
