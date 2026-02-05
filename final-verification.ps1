# Final Verification Script

Write-Host "="*80 -ForegroundColor Cyan
Write-Host "FINAL VERIFICATION - Testing All Endpoints" -ForegroundColor Cyan
Write-Host "="*80 -ForegroundColor Cyan

$API_BASE = "https://5tdsq6s7h3.execute-api.us-east-2.amazonaws.com"

Write-Host "`nTesting Contacts Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/contacts" -Method GET -UseBasicParsing
    Write-Host "✅ GET /contacts: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "❌ GET /contacts: FAILED" -ForegroundColor Red
}

Write-Host "`nTesting Campaigns Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/campaigns" -Method GET -UseBasicParsing
    Write-Host "✅ GET /campaigns: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "❌ GET /campaigns: FAILED" -ForegroundColor Red
}

Write-Host "`n"
Write-Host "="*80 -ForegroundColor Cyan
Write-Host "Verification Complete!" -ForegroundColor Cyan
Write-Host "="*80 -ForegroundColor Cyan
Write-Host "`nIf both endpoints show ✅, refresh your browser!"
