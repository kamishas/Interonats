# Email Agent Image Upload - Testing Guide

## Quick Test Checklist

### Test 1: Upload a Compliant Image
**Steps:**
1. Navigate to Email Agent → Compose Email tab
2. Click the attachment icon or "Attach File" button
3. Select a compliant image (e.g., a landscape, logo, or object photo)
4. Observe the upload process

**Expected Result:**
- ✅ Image should be uploaded successfully
- ✅ No error messages or warnings
- ✅ Image appears in the attachments list
- ✅ No compliance errors shown

**Network Request:**
- **Endpoint:** `POST https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod/images`
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "file": "base64-encoded-image-data...",
    "filename": "image.jpg",
    "contentType": "image/jpeg"
  }
  ```
- **Expected Response (200):**
  ```json
  {
    "isCompliant": true,
    "url": "https://...",
    "filename": "image.jpg"
  }
  ```

---

### Test 2: Upload a Non-Compliant Image
**Steps:**
1. Navigate to Email Agent → Compose Email tab
2. Click the attachment icon
3. Select an image that might contain EEOC violations (e.g., image with people/faces if your backend flags those)
4. Observe the upload process

**Expected Result:**
- ⚠️ Warning dialog should appear
- ⚠️ Dialog shows "EEOC Compliance Violation Detected in Attachments"
- ⚠️ Specific violations are listed
- ✅ Image is NOT added to attachments list
- ✅ File input is reset

**Network Request:**
- **Endpoint:** `POST https://5cs5faz106.execute-api.us-east-2.amazonaws.com/prod/images`
- **Content-Type:** `application/json`
- **Expected Response (200):**
  ```json
  {
    "isCompliant": false,
    "url": "https://...",
    "filename": "image.jpg",
    "violations": [
      { "message": "Image contains human faces" },
      { "message": "Potential bias detected" }
    ]
  }
  ```

---

### Test 3: Send Email with Compliant Images
**Steps:**
1. Upload one or more compliant images (see Test 1)
2. Select recipients
3. Enter subject and body
4. Click "Send Email"

**Expected Result:**
- ✅ Email sends successfully
- ✅ Campaign is created with image URLs
- ✅ Success message: "Email campaign sent to X recipients"
- ✅ Email appears in Sent Items

**Network Requests:**
1. **Create Campaign:** `POST /campaigns`
2. **Save Config:** `POST /campaigns/{id}/config`
   - **Body should include:**
     ```json
     {
       "subject": "...",
       "bodyTemplate": "...",
       "images": ["https://uploaded-url-1.jpg", "https://uploaded-url-2.jpg"]
     }
     ```
3. **Add Recipients:** `POST /campaigns/{id}/recipients`
4. **Send Campaign:** `POST /campaigns/{id}/send`

---

### Test 4: Attempt to Send with Non-Compliant Images
**Steps:**
1. Try to attach a non-compliant image
2. If it somehow gets attached (bug), try to send the email

**Expected Result:**
- ⚠️ Non-compliant images should NOT be attachable (Test 2)
- ⚠️ If compliance errors exist, send should be blocked
- ⚠️ Dialog shows: "Cannot Send Email - Attachment Compliance Issues"
- ⚠️ Toast error: "Cannot send email - Please remove or replace non-compliant attachments"

---

### Test 5: Remove Attachments
**Steps:**
1. Upload a compliant image
2. Click the X or Remove button on the attachment
3. Verify cleanup

**Expected Result:**
- ✅ Attachment removed from list
- ✅ Compliance state cleaned up
- ✅ URL mapping cleaned up
- ✅ No memory leaks or stale state

---

### Test 6: Large Image Upload
**Steps:**
1. Select a large image (>2MB)
2. Upload and observe

**Expected Result:**
- ✅ Image should still upload successfully
- ⏱️ Loading indicator should show during upload
- ✅ Base64 encoding should complete without errors
- ⚠️ May take longer due to file size

**Note:** If the backend has size limits, you may get a specific error. This is expected backend behavior.

---

### Test 7: Multiple Images at Once
**Steps:**
1. Select multiple images (2-5 images)
2. Upload them all at once

**Expected Result:**
- ✅ Each image is checked individually
- ✅ Compliant images are added
- ⚠️ Non-compliant images trigger warnings
- ✅ Partial success: compliant images attached, non-compliant rejected

---

## Debugging Tips

### Issue: 500 Error - "Expecting value: line 1 column 1"
**Cause:** Backend received invalid JSON or couldn't parse request
**Check:**
- Is the request sending `Content-Type: application/json`?
- Is the base64 string valid?
- Does the request body match the expected format?
- Check browser Network tab → Request Payload

### Issue: Images Not Attaching
**Check:**
1. Browser console for errors
2. Network tab for API response
3. Verify `response.isCompliant === true`
4. Check that `response.url` exists
5. Verify state updates in React DevTools

### Issue: Compliance Check Not Triggering
**Check:**
1. Is `file.type.startsWith('image/')` true?
2. Is the FileReader completing successfully?
3. Is base64 extraction working? (check `base64Data` in console)
4. Is the API call reaching the backend?

### Issue: Email Sends Without Images
**Check:**
1. Are URLs stored in `attachmentUrls` state?
2. Is `handleSendEmail` extracting URLs correctly?
3. Check the `/campaigns/{id}/config` request body
4. Verify `images` array in request payload

---

## Sample Test Images

### Compliant Image Examples:
- Company logos (no people)
- Product photos (no people)
- Landscapes
- Abstract designs
- Icons and graphics

### Potentially Non-Compliant (depends on backend rules):
- Photos with human faces
- Group photos
- Images showing age, race, gender
- Images with text containing biased language

---

## Console Logs to Monitor

```javascript
// In handleFileSelect
console.log('File selected:', file.name, file.type);
console.log('Base64 length:', base64.length);
console.log('API Response:', response);
console.log('Compliance:', response.isCompliant);
console.log('URL:', response.url);
console.log('Violations:', response.violations);

// In handleSendEmail
console.log('Attachments:', attachments);
console.log('Attachment URLs:', Array.from(attachmentUrls.entries()));
console.log('Image URLs for campaign:', imageUrls);
```

---

## Expected Error States (These are correct behaviors)

1. ⚠️ **Warning: "Unable to verify compliance for X"**
   - API call failed (network error, timeout, etc.)
   - Image is NOT blocked (failsafe behavior)
   - User can still attach it

2. ⚠️ **Dialog: "EEOC Compliance Violation Detected"**
   - API returned `isCompliant: false`
   - Image IS blocked
   - User must choose different image

3. ⛔ **Error: "Cannot send email"**
   - Compliance errors exist in `attachmentComplianceErrors` map
   - Sending is blocked until attachments are removed
   - User must remove non-compliant attachments

---

## Success Criteria

✅ All API requests use `Content-Type: application/json`  
✅ Images are base64-encoded before sending  
✅ Backend receives: `{ file, filename, contentType }`  
✅ Backend returns: `{ isCompliant, url, filename, violations? }`  
✅ Compliant images are attached with URLs stored  
✅ Non-compliant images are rejected with warnings  
✅ Email sending includes image URLs in campaign config  
✅ No 500 errors with "Expecting value" message  
✅ State cleanup works correctly when removing attachments  
