
Write-Host "Creating Enterprise Contact Tables..." -ForegroundColor Cyan

# 1. GlobalContacts Table
# PK: email (String)
Write-Host "Creating GlobalContacts Table..."
aws dynamodb create-table `
    --table-name GlobalContacts `
    --attribute-definitions AttributeName=email, AttributeType=S `
    --key-schema AttributeName=email, KeyType=HASH `
    --provisioned-throughput ReadCapacityUnits=5, WriteCapacityUnits=5 `
    --region us-east-2 `
    --no-cli-pager

# 2. ContactTags Table
# PK: tagName (String)
Write-Host "Creating ContactTags Table..."
aws dynamodb create-table `
    --table-name ContactTags `
    --attribute-definitions AttributeName=tagName, AttributeType=S `
    --key-schema AttributeName=tagName, KeyType=HASH `
    --provisioned-throughput ReadCapacityUnits=5, WriteCapacityUnits=5 `
    --region us-east-2 `
    --no-cli-pager

Write-Host "Tables Created Successfully!" -ForegroundColor Green
