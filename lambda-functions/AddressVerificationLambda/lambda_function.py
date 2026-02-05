import json
import os
import boto3
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    print("Received event: " + json.dumps(event))
    
    # Enable CORS
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
    }
    
    # Determine HTTP Method (Support generic, v1, and v2 payloads)
    http_method = event.get('httpMethod')
    if not http_method and 'requestContext' in event:
        http_method = event['requestContext'].get('http', {}).get('method')
    
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
        
    try:
        body_str = event.get('body', '{}')
        if not body_str:
            body_str = '{}'
        
        try:
            body = json.loads(body_str)
        except json.JSONDecodeError:
            body = {}
            
        action = body.get('action', 'verify')
        
        if action == 'autocomplete':
            return handle_autocomplete(body, headers)
        else:
            return handle_verification(body, headers)

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def get_location_client():
    # Credentials should be in environment variables:
    # AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
    return boto3.client('location', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

def handle_autocomplete(body, headers):
    query = body.get('query', '')
    bias_position = body.get('biasPosition')
    if not query or len(query) < 3:
         return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'suggestions': []})
        }

    try:
        client = get_location_client()
        index_name = os.environ.get('PLACE_INDEX_NAME', 'InteronAddressIndex')
        
        print(f"Querying Amazon Location Service (Suggestions): {query} on {index_name}")
        
        # Build params for Suggestions API
        params = {
            'IndexName': index_name,
            'Text': query,
            'MaxResults': 5,
            'FilterCountries': ['USA'],
            'Language': 'en'
        }
        
        # Add BiasPosition if provided
        # Format for Suggestions API is actually the same, expecting [lon, lat]
        if bias_position and isinstance(bias_position, list) and len(bias_position) == 2:
            try:
                params['BiasPosition'] = [float(bias_position[0]), float(bias_position[1])]
            except ValueError:
                print("Invalid biasPosition format")

        response = client.search_place_index_for_suggestions(**params)
        
        suggestions = []
        for item in response.get('Results', []):
           text = item.get('Text', '') # 'Text' is usually the label in Suggestions API
           place_id = item.get('PlaceId')
           
           # Suggestions API returns less detail initially, mainly Text and PlaceId.
           # We need to GetPlace if we want full details immediately, BUT for autocomplete speed,
           # we typically return the Text and then fetch details on selection (PlaceId).
           # HOWEVER, to keep frontend compatible without major refactor, we might need to fake the 'data' 
           # or adjust frontend. 
           # Let's check what Suggestions returns. It returns 'Text'.
           
           suggestions.append({
               'label': text,
               'value': place_id, # Store PlaceId for verification/details fetch
               'data': {
                   # Standard suggests response doesn't have components. 
                   # We'll use a flag to tell frontend to fetch details?
                   # Or just put nulls.
                   'place_id': place_id,
                   'is_suggestion': True
               }
           })
            
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'suggestions': suggestions})
        }

    except ClientError as e:
        print(f"Location Service Error: {e}")
        return {
            'statusCode': 200, 
            'headers': headers,
            'body': json.dumps({'suggestions': [], 'debug_error': str(e)})
        }
    except Exception as e:
        print(f"General Error: {e}")
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'suggestions': [], 'debug_error': str(e)})
        }

def handle_verification(body, headers):
    # Perform a search to standardize/verify
    client = get_location_client()
    index_name = os.environ.get('PLACE_INDEX_NAME', 'InteronAddressIndex')
    
    street = body.get('street', '')
    city = body.get('city', '')
    state = body.get('state', '')
    zip_code = body.get('zip', '')
    
    full_address = f"{street}, {city}, {state} {zip_code}".strip()
    
    response_data = {
        "isValid": True, # Assume valid unless search fails drastically? Or logic here.
        "original": {
            "street": street,
            "city": city,
            "state": state,
            "zip": zip_code
        },
        "standardized": {
            "street": street.upper(),
            "city": city.upper(),
            "state": state.upper(),
            "zip5": zip_code.split('-')[0] if '-' in zip_code else zip_code,
            "zip4": ""
        },
        "message": "Verify check passed (Amazon Location)"
    }
    
    try:
        place_id = body.get('place_id')
        
        if place_id:
             # If we have a PlaceId (from suggestion), use GetPlace
            print(f"Verifying via PlaceId: {place_id}")
            place_resp = client.get_place(IndexName=index_name, PlaceId=place_id)
            best_match = place_resp.get('Place', {})
            
            # Populate from GetPlace result
            address_number = best_match.get('AddressNumber', '')
            street_name = best_match.get('Street', '')
            is_interpolated = best_match.get('Interpolated', False)
            
            # STRICT VALIDATION RULES
            validation_errors = []
            
            if is_interpolated:
                validation_errors.append("Estimated/interpolated addresses are not accepted. Please select a specific building.")
            
            if not address_number:
                validation_errors.append("House/Building number is missing.")
                
            if not street_name:
                validation_errors.append("Street name is missing.")
            
            if validation_errors:
                response_data['isValid'] = False
                response_data['message'] = "Validation Failed: " + " ".join(validation_errors)
                # Still return standardized data in case we want to show it, but marked invalid
            else:
                response_data['isValid'] = True
                response_data['message'] = "Address verified properties from Amazon Location Service"

            response_data['standardized']['street'] = (address_number + ' ' + street_name).strip().upper()
            response_data['standardized']['city'] = best_match.get('Municipality', '').upper()
            response_data['standardized']['state'] = best_match.get('Region', '').upper()
            pc = best_match.get('PostalCode', '')
            response_data['standardized']['zip5'] = pc.split('-')[0] if '-' in pc else pc
            response_data['isInterpolated'] = is_interpolated # Useful for debugging
        
        else:
            # Fallback to Text Search (Legacy verification)
            # Strict verification using the full address
            search_resp = client.search_place_index_for_text(
                IndexName=index_name,
                Text=full_address,
                MaxResults=1,
                FilterCountries=['USA']
            )
            
            results = search_resp.get('Results', [])
            if results:
                best_match = results[0].get('Place', {})
                # Note: SearchPlaceIndexForText might not return Interpolated flag reliably in all providers/versions
                # But we apply same logic if possible
                
                address_number = best_match.get('AddressNumber', '')
                street_name = best_match.get('Street', '')
                is_interpolated = best_match.get('Interpolated', False)
                
                validation_errors = []
                if is_interpolated: validation_errors.append("Estimated address.")
                if not address_number: validation_errors.append("Missing number.")
                if not street_name: validation_errors.append("Missing street.")

                if validation_errors:
                    response_data['isValid'] = False
                    response_data['message'] = "Validation Failed: " + " ".join(validation_errors)
                else:
                    response_data['isValid'] = True
                    response_data['message'] = "Address verified properties from Amazon Location Service"
                
                response_data['standardized']['street'] = (address_number + ' ' + street_name).strip().upper()
                response_data['standardized']['city'] = best_match.get('Municipality', '').upper()
                response_data['standardized']['state'] = best_match.get('Region', '').upper()
                pc = best_match.get('PostalCode', '')
                response_data['standardized']['zip5'] = pc.split('-')[0] if '-' in pc else pc
            else:
                response_data['isValid'] = False
                response_data['message'] = "Address could not be verified by Location Service"

    except Exception as e:
        print(f"Verification Error: {e}")
        response_data['message'] = f"Verification check failed: {str(e)}"

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response_data)
    }
