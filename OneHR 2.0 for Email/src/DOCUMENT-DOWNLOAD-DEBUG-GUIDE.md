# Document Download Mismatch - Debugging Guide

## 🐛 Issue Report

**Problem:** When downloading a document (e.g., "sai resume"), the downloaded PDF shows metadata from a DIFFERENT document (e.g., "Bonthu_Term Paper Topic.docx").

**Impact:** Users see incorrect document information in the downloaded placeholder PDFs.

---

## 🔍 Debugging Steps Added

I've added comprehensive debugging to help identify where the mismatch is occurring:

### **1. Document List Debug Panel** (Orange Alert Box)

**Location:** Employee Documents tab - above the document list

**Shows:**
- Total number of documents for this employee
- Each document with:
  - Document Name
  - Document ID (unique identifier)
  - File Name
  - Document Type

**Purpose:** Verify which documents exist for this employee

**What to Look For:**
- Are there multiple documents with similar names?
- Do you see the "sai resume" document in the list?
- Do you see the "Bonthu_Term Paper Topic.docx" document in the list?
- Are they both assigned to the same employee?

---

### **2. Document Click Console Logs**

**When:** You click the eye icon 👁 to view a document

**Console Output:**
```
=== DOCUMENT CLICKED ===
Document ID: abc-123-def-456
Document Name: sai resume
Document Type: Resume
File Name: sai_resume.pdf
Upload Date: 2025-11-04T10:30:00Z
Full document object: {id: "abc-123", ...}
========================
```

**Purpose:** Verify the correct document is being selected when you click

**What to Look For:**
- Does the "Document Name" match what you clicked?
- Does the "File Name" match what you expect?
- Note the "Document ID" - this should be unique

---

### **3. View Dialog Debug Panel** (Purple Alert Box)

**Location:** Top of the View Document dialog

**Shows:**
- Document ID
- Document Name
- File Name
- Document Type
- Upload Date with time

**Purpose:** Verify the selected document in the dialog state

**What to Look For:**
- Does this match what you clicked?
- If it doesn't match, the state is being changed AFTER the click
- Compare the Document ID with the one from the console log

---

### **4. Download Button Console Logs**

**When:** You click the "Download Document" button

**Console Output:**
```
=== DOWNLOAD CLICKED ===
Selected Document at download time:
Document ID: abc-123-def-456
Document Name: sai resume
Document Type: Resume
File Name: sai_resume.pdf
Upload Date: 2025-11-04T10:30:00Z
Full object: {id: "abc-123", ...}
========================
```

**Purpose:** Verify which document is selected when generating the PDF

**What to Look For:**
- Does this match the purple debug panel?
- Does this match what you clicked originally?
- If the Document ID changed, something is modifying state between steps

---

## 🔬 How to Debug the Issue

### **Step 1: Check the Document List**

1. Go to Employee Documents tab
2. Look at the **orange debug panel** at the top
3. **Question:** Do you see BOTH documents listed?
   - ✅ "sai resume"
   - ✅ "Bonthu_Term Paper Topic.docx"

**If YES:** Multiple documents exist for this employee (this could be the issue)

**If NO:** Only one document exists, so why is the wrong one showing?

---

### **Step 2: Click the Eye Icon**

1. Click the eye icon 👁 on "sai resume"
2. Open browser console (F12)
3. Look at the console log output
4. **Question:** Does the console show "sai resume"?

**Expected:**
```
=== DOCUMENT CLICKED ===
Document Name: sai resume
File Name: sai_resume.pdf (or similar)
```

**If Wrong:**
```
=== DOCUMENT CLICKED ===
Document Name: Bonthu_Term Paper Topic.docx  ← PROBLEM!
File Name: Bonthu_Term Paper Topic.docx
```

**If the clicked document is wrong:** The issue is in the document list rendering - the wrong document object is mapped to the button.

---

### **Step 3: Check the View Dialog**

1. Look at the **purple debug panel** at the top of the dialog
2. **Question:** Does it show "sai resume"?

**Expected:**
- Document Name: sai resume
- File Name: sai_resume.pdf
- Document ID: (should match console log)

**If Wrong:**
- The state was changed between click and dialog open
- Possible React state race condition
- Or multiple `setSelectedDocument` calls

---

### **Step 4: Click Download**

1. Click the "Download Document" button
2. Check the console log
3. **Question:** Does it still show "sai resume"?

**Expected:**
```
=== DOWNLOAD CLICKED ===
Document Name: sai resume
```

**If Wrong:**
- The state changed between dialog open and download
- Very rare - would indicate a serious React issue

---

### **Step 5: Compare All IDs**

1. From Step 2 console: Note the Document ID
2. From Step 3 purple panel: Note the Document ID  
3. From Step 4 console: Note the Document ID

**Question:** Are all three IDs the SAME?

**If YES:** The correct document is selected, but the data is wrong
- **Issue:** The document's metadata in the database is wrong
- **Solution:** Check the backend - document was saved with wrong data

**If NO:** The ID changed between steps
- **Issue:** React state is being modified incorrectly
- **Solution:** Check for race conditions, multiple state updates

---

## 🎯 Common Scenarios

### **Scenario 1: Multiple Documents with Same Employee**

**Symptom:**
- Orange debug panel shows 2+ documents
- Both have different names
- Clicking one shows the other

**Root Cause:**
- Document array mapping issue
- Wrong index or key
- State confusion

**Fix:**
```typescript
// Check the key prop
{uploadedDocuments.map(doc => (
  <div key={doc.id}>  ← MUST be unique doc.id!
```

**Action:**
1. Check if `doc.id` is truly unique
2. Verify the map index isn't being used as key
3. Check for duplicate IDs in orange debug panel

---

### **Scenario 2: Document Saved with Wrong Metadata**

**Symptom:**
- Console logs show correct "sai resume" all the way through
- But fileName in database is "Bonthu_Term Paper Topic.docx"
- All debug panels show the mismatch

**Root Cause:**
- Upload endpoint saved wrong data
- Form data was incorrect during upload
- fileName wasn't properly set

**Fix:**
Check upload code:
```typescript
const uploadData = {
  employeeId: employee.id,
  documentType: uploadForm.documentType,
  documentName: uploadForm.documentName,  ← Should be "sai resume"
  fileName: uploadFile.name,              ← Should be "sai_resume.pdf"
  fileSize: uploadFile.size,
};
```

**Action:**
1. Upload a NEW document with console logging
2. Check what `uploadFile.name` contains
3. Verify the server receives correct data

---

### **Scenario 3: React State Race Condition**

**Symptom:**
- Step 2 (click) shows "sai resume"
- Step 3 (dialog) shows "Bonthu_Term Paper Topic.docx"
- Document ID changed between steps

**Root Cause:**
- Multiple `setSelectedDocument` calls
- Async state update race
- Component re-render issue

**Fix:**
```typescript
onClick={() => {
  console.log('Setting document:', doc);
  setSelectedDocument(doc);  ← Only ONE call
  setShowViewDialog(true);
}}
```

**Action:**
1. Search code for all `setSelectedDocument` calls
2. Check for `useEffect` that might change it
3. Verify no prop changes trigger updates

---

### **Scenario 4: Wrong Document Retrieved from Backend**

**Symptom:**
- Upload "sai resume" 
- Immediately see "Bonthu_Term Paper Topic.docx" in list
- Never worked correctly

**Root Cause:**
- Backend returned wrong document
- Employee ID mismatch
- Database filter issue

**Fix:**
Check server logs:
```
Fetching documents for employeeId: emp-123
Documents after filtering: 2
Document 1: {id: "doc-1", documentName: "sai resume"}
Document 2: {id: "doc-2", documentName: "Bonthu_Term Paper Topic.docx"}
```

**Action:**
1. Check which employeeId is being sent
2. Verify both documents have same employeeId in database
3. Check if they should be for different employees

---

## 📊 Debugging Checklist

Use this checklist to systematically debug:

- [ ] **Check Orange Debug Panel**
  - [ ] How many documents are listed?
  - [ ] Is "sai resume" in the list?
  - [ ] Is "Bonthu_Term Paper Topic.docx" in the list?
  - [ ] Note all Document IDs

- [ ] **Click Eye Icon on "sai resume"**
  - [ ] Open browser console (F12)
  - [ ] Read "=== DOCUMENT CLICKED ===" log
  - [ ] Document Name matches? _______________
  - [ ] File Name matches? _______________
  - [ ] Document ID: _______________

- [ ] **Check Purple Debug Panel in Dialog**
  - [ ] Document Name: _______________
  - [ ] File Name: _______________
  - [ ] Document ID: _______________
  - [ ] Does it match Step 2? [ ] YES [ ] NO

- [ ] **Click Download Button**
  - [ ] Check console "=== DOWNLOAD CLICKED ==="
  - [ ] Document Name: _______________
  - [ ] File Name: _______________
  - [ ] Document ID: _______________
  - [ ] Does it match Step 3? [ ] YES [ ] NO

- [ ] **Compare All IDs**
  - [ ] Step 2 ID: _______________
  - [ ] Step 3 ID: _______________
  - [ ] Step 4 ID: _______________
  - [ ] All same? [ ] YES [ ] NO

- [ ] **Check Downloaded PDF**
  - [ ] Document Name in PDF: _______________
  - [ ] File Name in PDF: _______________
  - [ ] Does it match Step 4? [ ] YES [ ] NO

---

## 🔧 Expected vs Actual

### **Expected Workflow:**

```
1. Employee uploads "sai_resume.pdf"
        ↓
2. Server saves:
   {
     id: "doc-abc-123",
     documentName: "sai resume",
     fileName: "sai_resume.pdf",
     employeeId: "emp-456"
   }
        ↓
3. Frontend fetches documents
        ↓
4. Displays "sai resume" in list
        ↓
5. User clicks eye icon on "sai resume"
        ↓
6. Console: "Document Name: sai resume" ✅
        ↓
7. Dialog shows "sai resume" ✅
        ↓
8. Download generates PDF with "sai resume" ✅
```

### **Actual (Broken) Workflow:**

```
1. Employee uploads "sai_resume.pdf"
        ↓
2. Server saves ??? (need to verify)
        ↓
3. Frontend fetches documents
        ↓
4. Displays "sai resume" in list
        ↓
5. User clicks eye icon on "sai resume"
        ↓
6. Console: "Document Name: ???" (check this!)
        ↓
7. Dialog shows "???" (check this!)
        ↓
8. Download generates PDF with "Bonthu_Term Paper Topic.docx" ❌
```

**Where does it break?** Use the debugging steps to find out!

---

## 💡 Quick Fixes to Try

### **Fix 1: Delete All Documents and Start Fresh**

**Purpose:** Eliminate corrupt data

**Steps:**
1. Login as employee
2. Delete ALL documents
3. Upload ONLY "sai_resume.pdf"
4. Check if it shows correctly
5. Try downloading

**If this fixes it:** The issue was duplicate/corrupt documents

---

### **Fix 2: Use Different Employee**

**Purpose:** Test if it's employee-specific

**Steps:**
1. Create new test employee
2. Upload "sai_resume.pdf" as that employee
3. Try downloading

**If this fixes it:** The original employee has data corruption

---

### **Fix 3: Clear Browser Cache**

**Purpose:** Eliminate stale React state

**Steps:**
1. Clear browser cache
2. Hard reload (Ctrl+Shift+R)
3. Login again
4. Try uploading and downloading

**If this fixes it:** Browser cache issue

---

### **Fix 4: Check for Multiple Employees Sharing Documents**

**Purpose:** Verify employeeId isolation

**Steps:**
1. Look at orange debug panel
2. Note all document IDs
3. Login as HR
4. Check Documents tab - search for those IDs
5. Verify all documents have correct employeeId

**If documents have wrong employeeId:** Backend filtering issue

---

## 📱 How to Share Debug Info

If the issue persists, share this info:

### **Screenshot 1: Orange Debug Panel**
- Shows all documents for employee
- Include full list with IDs

### **Screenshot 2: Console Logs**
- After clicking eye icon
- Shows "=== DOCUMENT CLICKED ==="

### **Screenshot 3: Purple Debug Panel**
- In the view dialog
- Shows selected document details

### **Screenshot 4: Downloaded PDF**
- Shows the wrong document name

### **Text Info:**
```
Employee ID: _______________
Number of documents: _______________
Expected document: _______________
Actual document in PDF: _______________

Document IDs from orange panel:
1. _______________ (name: _______________)
2. _______________ (name: _______________)
3. _______________ (name: _______________)
```

---

## 🎯 Next Steps

1. **Follow the debugging checklist above**
2. **Take screenshots of each debug panel**
3. **Copy console log output**
4. **Note where the mismatch occurs**
5. **Share findings**

Then we can:
- Identify the exact point of failure
- Fix the root cause
- Add permanent safeguards
- Implement real file storage if needed

---

## 🚨 Important Note

**This is a PROTOTYPE** - we're not storing actual file data, only metadata. The downloaded PDFs are placeholders that show the document's metadata (name, type, size, etc.).

**The bug is:** The wrong document's metadata is being shown in the placeholder.

**This would also affect real file storage** if implemented, so we must fix the root cause of the document mismatch!

---

**Status:** 🔍 Debugging tools added - awaiting test results

**Date:** November 4, 2025

**Impact:** HIGH - Users cannot trust document downloads

**Action Required:** Follow debugging steps and report findings
