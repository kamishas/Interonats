# Employee Document Edit & Delete Feature

## Overview
Employees can now edit and delete documents they've uploaded through the Employee Portal. This gives employees more control over their document submissions during the onboarding process.

## Features Added

### 1. **Edit Document Details**
- Employees can edit the following fields for their uploaded documents:
  - Document Name
  - Expiry Date
  - Notes
- **Document Type cannot be changed** (if you need to change it, delete and re-upload)
- **File cannot be replaced** (delete and re-upload instead)

### 2. **Delete Document**
- Employees can permanently delete uploaded documents
- Confirmation dialog prevents accidental deletion
- Useful for removing incorrect uploads or outdated documents

### 3. **Restrictions**
- **Only pending or rejected documents** can be edited or deleted
- **Verified documents cannot be modified** to maintain data integrity
- Visual indicators show which documents can be edited

## User Interface

### Document List View
Each uploaded document now shows:
- **View button (👁)**: View document details (all documents)
- **Edit button (✏️)**: Edit document metadata (pending/rejected only)
- **Delete button (🗑)**: Delete document (pending/rejected only)
- **Verified label**: Shows "✓ Verified (cannot edit)" for verified documents

### Edit Dialog
When editing a document:
1. Document Type is shown but grayed out (cannot change)
2. Document Name can be updated
3. Expiry Date can be added or modified
4. Notes can be added or updated
5. Info message explains file replacement requires delete + re-upload

### Delete Confirmation
- Browser confirmation dialog asks: "Are you sure you want to delete [document name]? This action cannot be undone."
- Prevents accidental deletions

## Backend Endpoints

### Update Document
```
PUT /make-server-f8517b5b/documents/:id
Body: {
  documentName: string,
  expiryDate: string (optional),
  notes: string (optional)
}
```

### Delete Document
```
DELETE /make-server-f8517b5b/documents/:id
```
(Already existed, no changes needed)

## When to Use Each Feature

### Edit Document
- Fix typos in document name
- Add or update expiry date
- Add clarifying notes
- Update information after HR rejection

### Delete Document
- Remove duplicate uploads
- Delete incorrect document type (then re-upload correctly)
- Remove outdated document version
- Clear rejected documents before re-uploading

### Re-upload Instead of Edit
If you need to:
- Change the document type
- Replace the actual file
- Upload a different version

Then: **Delete the document and upload a new one**

## Workflow Integration

### Document Status Flow
1. **Uploaded** → Pending Review (can edit/delete)
2. **Under Review** → Pending (can edit/delete)
3. **Rejected** → Can edit details or delete and re-upload
4. **Verified** → Locked, cannot edit or delete

### Impact on Document Requests
- Deleting a document that fulfilled a request will NOT re-open the request
- If you need to submit a different document for a request, delete the old one and upload a new one

## Benefits

### For Employees
- ✅ Fix mistakes without contacting HR
- ✅ Update document information as needed
- ✅ Remove duplicate or incorrect uploads
- ✅ Maintain control over their submission

### For HR
- ✅ Fewer support requests for document updates
- ✅ Employees can self-correct minor issues
- ✅ Verified documents remain protected
- ✅ Audit trail maintained via timestamps

## Technical Details

### Security
- Only employees can edit/delete their own documents
- Verified documents are read-only
- Deletion requires explicit confirmation
- All actions are logged with timestamps

### Data Integrity
- Document ID remains the same after edit
- Upload date is preserved
- Last modified timestamp is added on edit
- Version history not maintained (future enhancement)

### UI/UX Considerations
- Edit/Delete buttons only shown when applicable
- Clear visual feedback on success/error
- Helpful descriptions and tooltips
- Confirmation dialogs prevent accidents

## Future Enhancements
Potential future additions:
- Document version history
- Bulk delete capability
- Document replacement (file + metadata in one action)
- Reason field for deletions
- Undo delete (trash/archive)
- Activity log for document changes

## Testing Checklist

### Employee View
- [ ] Upload a document
- [ ] Edit document name, expiry date, notes
- [ ] Verify changes are saved
- [ ] Delete a pending document
- [ ] Confirm deletion works
- [ ] Verify cannot edit verified documents
- [ ] Verify cannot delete verified documents
- [ ] Check edit/delete buttons not shown for verified docs

### HR View
- [ ] Verify HR can still see all documents
- [ ] Confirm employee edits are visible to HR
- [ ] Verify verification still works
- [ ] Check that verified docs can't be edited by employees

## Support

If employees encounter issues:
1. **Can't edit a document**: Check if it's been verified (verified docs can't be edited)
2. **Need to change document type**: Delete and re-upload with correct type
3. **Need to replace file**: Delete current document and upload new one
4. **Accidental deletion**: Contact HR to re-request the document

---

**Implementation Date**: January 2025  
**Status**: ✅ Complete  
**Components Modified**: 
- `/components/employee-document-upload.tsx`
- `/supabase/functions/server/index.tsx`
