# Email Agent - Image Upload Fix (Updated)

## Issue
The Email Agent module was experiencing 500 errors when uploading images for EEOC compliance checking. The error "Expecting value: line 1 column 1 (char 0)" indicated that the backend endpoint expects JSON data, not multipart/form-data.

## Root Cause
- The `/images` endpoint expects JSON with base64-encoded image data
- Initial implementation tried to send FormData (multipart/form-data)
- Backend tried to parse the multipart request as JSON, causing the 500 error

## Solution
Changed from FormData approach to JSON with base64-encoded images:

### 1. Updated API Method in `/lib/email-agent-api.ts`
**Changed from:**
```typescript
checkImage: (formData: FormData) =>
  fetchClient(`${DATA_API_URL}/images`, {
    method: 'POST',
    body: formData,
  }),
```

**Changed to:**
```typescript
checkImage: (imageData: { file: string; filename: string; contentType: string }) =>
  fetchClient(`${DATA_API_URL}/images`, {
    method: 'POST',
    body: JSON.stringify(imageData),
  }),
```

### 2. Updated File Upload Logic in `/components/email-agent.tsx`
Modified `handleFileSelect` to convert images to base64 before sending:

```typescript
// Convert file to base64
const base64 = await new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result as string;
    // Extract base64 data (remove data:image/xxx;base64, prefix)
    const base64Data = result.split(',')[1];
    resolve(base64Data);
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const response = await emailAgentApi.compliance.checkImage({
  file: base64,
  filename: file.name,
  contentType: file.type
});
```

## Expected Request Format
The `/images` endpoint now receives JSON:

```json
{
  "file": "base64-encoded-image-data-here...",
  "filename": "image.jpg",
  "contentType": "image/jpeg"
}
```

## Expected Response Format
```json
{
  "isCompliant": true,
  "url": "https://example.com/uploaded-image.jpg",
  "filename": "image.jpg",
  "violations": [] // Only present if isCompliant is false
}
```

## Complete Workflow

### Upload Process:
1. User selects image file(s)
2. For each image:
   - Read file as DataURL using FileReader
   - Extract base64 data (remove the `data:image/xxx;base64,` prefix)
   - Create JSON payload with { file: base64, filename, contentType }
   - Send to `/images` endpoint as JSON (Content-Type: application/json)
3. API validates image for EEOC compliance
4. If compliant: Store file and its returned URL
5. If non-compliant: Show warning dialog, prevent attachment

### Sending Process:
1. Prevent email sending if any attachments have compliance errors
2. Extract URLs for all compliant image attachments
3. Include image URLs in campaign configuration
4. Send email campaign with compliant images

## Key Features Maintained
✅ Automatic EEOC compliance checking for all image uploads  
✅ Visual indicators for non-compliant files  
✅ Warning dialogs for compliance violations  
✅ Prevention of email sending with non-compliant attachments  
✅ Proper cleanup of attachment data when removed  
✅ Integration with AWS Lambda compliance endpoint  
✅ Base64 encoding for reliable image transmission  
✅ JSON-based API communication  

## Technical Details
- Uses `FileReader.readAsDataURL()` to convert File objects to base64
- Strips the `data:image/xxx;base64,` prefix before sending
- Maintains original filename and content type for backend processing
- All requests use `Content-Type: application/json`
- Authorization header included for authenticated requests

## Testing Recommendations
1. Test image upload with compliant images - should succeed
2. Test image upload with non-compliant images - should show warning dialog
3. Test sending email with compliant images - should include image URLs
4. Test attempting to send with non-compliant images - should be prevented
5. Test removing attachments - should clean up all related state
6. Verify network requests show JSON payload with base64 data
7. Check that large images (>1MB) are handled correctly
