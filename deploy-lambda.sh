#!/bin/bash

# Deploy ImageComplianceLambda
echo "Deploying ImageComplianceLambda..."

aws lambda create-function \
  --function-name ImageComplianceLambda \
  --runtime python3.11 \
  --role arn:aws:iam::397753625517:role/ImageComplianceLambdaRole \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda-functions/ImageComplianceLambda/image-compliance.zip \
  --timeout 30 \
  --memory-size 1024 \
  --region us-east-2 2>&1

if [ $? -ne 0 ]; then
  echo "Function exists, updating code..."
  aws lambda update-function-code \
    --function-name ImageComplianceLambda \
    --zip-file fileb://lambda-functions/ImageComplianceLambda/image-compliance.zip \
    --region us-east-2
fi

echo "Lambda deployed successfully!"
