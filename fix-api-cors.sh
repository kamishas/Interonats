#!/bin/bash

echo "=== Fixing API Gateway CORS for /images endpoint ==="

API_ID="5cs5faz106"
RESOURCE_ID="84f7zl"
REGION="us-east-2"

echo "Step 1: Delete existing OPTIONS integration response..."
aws apigateway delete-integration-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --region $REGION 2>/dev/null || echo "No existing integration response"

echo "Step 2: Delete existing OPTIONS method response..."
aws apigateway delete-method-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --region $REGION 2>/dev/null || echo "No existing method response"

echo "Step 3: Delete OPTIONS method..."
aws apigateway delete-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --region $REGION 2>/dev/null || echo "No existing OPTIONS method"

echo "Step 4: Create new OPTIONS method..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $REGION

echo "Step 5: Create MOCK integration for OPTIONS..."
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json":"{\"statusCode\":200}"}' \
  --region $REGION

echo "Step 6: Create method response with CORS headers..."
aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' \
  --region $REGION

echo "Step 7: Create integration response with wildcard CORS..."
aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'*'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'*'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
  --region $REGION

echo "Step 8: Deploy to prod..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --description "Fix CORS - wildcard all" \
  --region $REGION

echo ""
echo "=== CORS Configuration Complete ==="
echo "Endpoint: https://$API_ID.execute-api.$REGION.amazonaws.com/prod/images"
echo "CORS Headers: Access-Control-Allow-Origin: *, Methods: *, Headers: *"
