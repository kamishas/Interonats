# ✅ Client-Employee Linking - Testing Checklist

## Quick Testing Guide

Use this checklist to verify the client-employee linking feature works correctly.

---

## 🧪 Test Scenarios

### ✅ **Test 1: View Client Dropdown**

**Steps:**
1. Navigate to Employee Onboarding
2. Click "New Employee"
3. Scroll to "Client Assignment" section

**Expected Result:**
- [ ] "Client Assignment" label visible
- [ ] "+ Add New Client" button visible on right
- [ ] Dropdown shows placeholder "Select a client (optional)"
- [ ] Click dropdown
- [ ] "No client (Internal/Non-billable)" option appears first
- [ ] All existing clients listed with building icons
- [ ] Dropdown is scrollable if many clients

---

### ✅ **Test 2: Select Existing Client**

**Steps:**
1. Open employee form
2. Fill in: First Name, Last Name, Email
3. Click "Client Assignment" dropdown
4. Select "Acme Corporation" (or any existing client)

**Expected Result:**
- [ ] Client selected in dropdown
- [ ] Text below shows: "Selected: Acme Corporation"
- [ ] PO Number field appears
- [ ] PO Number field is editable
- [ ] Can enter text in PO field

---

### ✅ **Test 3: Select No Client**

**Steps:**
1. Open employee form
2. Fill in basic info
3. Click "Client Assignment" dropdown
4. Select "No client (Internal/Non-billable)"

**Expected Result:**
- [ ] Dropdown shows "No client (Internal/Non-billable)"
- [ ] No "Selected:" text appears
- [ ] PO Number field is NOT visible
- [ ] Can still create employee

---

### ✅ **Test 4: Quick Add New Client**

**Steps:**
1. Open employee form
2. Click "+ Add New Client" button
3. Dialog opens

**Expected Result:**
- [ ] "Quick Add Client" dialog appears
- [ ] Dialog title: "Quick Add Client"
- [ ] Description visible
- [ ] Form fields visible:
  - [ ] Company Name * (required)
  - [ ] Contact Person * (required)
  - [ ] Email * (required)
  - [ ] Phone (optional)
  - [ ] Industry (dropdown, optional)
  - [ ] Payment Terms (dropdown, defaults to "Net 30")
- [ ] Cancel button visible
- [ ] "Add Client & Assign" button visible

---

### ✅ **Test 5: Create Client with All Fields**

**Steps:**
1. Click "+ Add New Client"
2. Fill in:
   - Company Name: "Test Corp Inc"
   - Contact Person: "Jane Smith"
   - Email: "jane@testcorp.com"
   - Phone: "+1 (555) 123-4567"
   - Industry: "Technology"
   - Payment Terms: "Net 30"
3. Click "Add Client & Assign"

**Expected Result:**
- [ ] Success toast appears: "Client created successfully"
- [ ] Dialog closes automatically
- [ ] Client dropdown now shows "Test Corp Inc"
- [ ] "Selected: Test Corp Inc" text appears
- [ ] PO Number field is visible
- [ ] Can continue with employee creation

**Verify in Client Module:**
- [ ] Navigate to Client Onboarding
- [ ] "Test Corp Inc" appears in client list
- [ ] All entered data is correct

---

### ✅ **Test 6: Validation - Empty Fields**

**Steps:**
1. Click "+ Add New Client"
2. Leave all fields empty
3. Click "Add Client & Assign"

**Expected Result:**
- [ ] Error toast appears
- [ ] Message: "Please fill in all required fields (Company Name, Contact Person, Email)"
- [ ] Dialog stays open
- [ ] No client created

---

### ✅ **Test 7: Validation - Partial Fields**

**Steps:**
1. Click "+ Add New Client"
2. Fill only Company Name: "Partial Corp"
3. Leave Contact Person and Email empty
4. Click "Add Client & Assign"

**Expected Result:**
- [ ] Error toast appears
- [ ] Message mentions required fields
- [ ] Dialog stays open
- [ ] No client created
- [ ] Filled data remains in form

---

### ✅ **Test 8: Cancel Quick Add**

**Steps:**
1. Click "+ Add New Client"
2. Fill in some data:
   - Company Name: "Cancel Test"
   - Contact Person: "Test Person"
3. Click "Cancel"

**Expected Result:**
- [ ] Dialog closes
- [ ] No toast message
- [ ] No client created
- [ ] Employee form still visible
- [ ] No client selected in dropdown

**Verify Reset:**
1. Click "+ Add New Client" again

**Expected:**
- [ ] Form is empty
- [ ] Previous data was cleared

---

### ✅ **Test 9: Complete Employee Creation with Client**

**Steps:**
1. Click "New Employee"
2. Fill in:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john.doe@test.com"
   - Position: "Software Engineer"
   - Department: "Engineering"
3. Select client: "Test Corp Inc"
4. Enter PO Number: "PO-2024-001"
5. Fill other required fields
6. Click "Create & Start Workflow"

**Expected Result:**
- [ ] Success toast: "Employee created successfully"
- [ ] Dialog closes
- [ ] Employee appears in list
- [ ] Employee card shows:
  - [ ] Name: John Doe
  - [ ] Email: john.doe@test.com
  - [ ] Other details

**Verify Data:**
- [ ] Click employee workflow
- [ ] Check if client data saved correctly

---

### ✅ **Test 10: Complete Employee Creation - No Client**

**Steps:**
1. Click "New Employee"
2. Fill in basic info
3. Select "No client (Internal/Non-billable)"
4. Complete form
5. Click "Create & Start Workflow"

**Expected Result:**
- [ ] Employee created successfully
- [ ] No client assignment
- [ ] No PO number
- [ ] Employee marked as internal

---

### ✅ **Test 11: Switch Between Clients**

**Steps:**
1. Open employee form
2. Select "Acme Corporation"
3. Note PO field appears
4. Change to "Tech Corp"
5. Note "Selected:" text updates
6. Change to "No client"
7. Note PO field disappears

**Expected Result:**
- [ ] Dropdown updates correctly
- [ ] "Selected:" text matches selection
- [ ] PO field shows/hides appropriately
- [ ] No errors or glitches

---

### ✅ **Test 12: Multiple Quick-Adds**

**Steps:**
1. Quick-add client: "Client A"
2. Verify it works
3. Don't assign to employee
4. Quick-add another: "Client B"
5. Verify it works
6. Check dropdown

**Expected Result:**
- [ ] Both clients created
- [ ] Both appear in dropdown
- [ ] Can select either
- [ ] Both exist in Client module

---

### ✅ **Test 13: Error Handling - API Failure**

**Steps:**
1. Disconnect internet (or simulate API failure)
2. Try to quick-add a client
3. Observe behavior

**Expected Result:**
- [ ] Error toast appears
- [ ] Message: "Failed to create client"
- [ ] Dialog stays open
- [ ] Can retry or cancel
- [ ] No partial data created

---

### ✅ **Test 14: Large Client List**

**Prerequisite:** Create 20+ clients

**Steps:**
1. Open employee form
2. Click client dropdown
3. Scroll through list

**Expected Result:**
- [ ] Dropdown is scrollable
- [ ] All clients visible
- [ ] Performance is good
- [ ] Can search/filter (if implemented)
- [ ] Can select any client

---

### ✅ **Test 15: Responsive Design**

**Steps:**
1. Open on desktop
2. Create employee with client
3. Open on tablet
4. Create employee with client
5. Open on mobile
6. Create employee with client

**Expected Result:**
- [ ] **Desktop:** Full 2-column layout
- [ ] **Tablet:** Adjusted layout
- [ ] **Mobile:** Single column, stacked
- [ ] All buttons accessible
- [ ] Dialog fits screen
- [ ] No horizontal scroll
- [ ] Touch-friendly on mobile

---

## 📊 Testing Summary

### **Pass Criteria:**
- All 15 tests pass
- No console errors
- No data corruption
- UI responsive and smooth
- Error messages clear
- Success feedback visible

### **Results Tracking:**

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | View Client Dropdown | ⬜ | |
| 2 | Select Existing Client | ⬜ | |
| 3 | Select No Client | ⬜ | |
| 4 | Quick Add New Client | ⬜ | |
| 5 | Create Client (All Fields) | ⬜ | |
| 6 | Validation - Empty | ⬜ | |
| 7 | Validation - Partial | ⬜ | |
| 8 | Cancel Quick Add | ⬜ | |
| 9 | Complete Creation (Client) | ⬜ | |
| 10 | Complete Creation (No Client) | ⬜ | |
| 11 | Switch Between Clients | ⬜ | |
| 12 | Multiple Quick-Adds | ⬜ | |
| 13 | Error Handling | ⬜ | |
| 14 | Large Client List | ⬜ | |
| 15 | Responsive Design | ⬜ | |

**Legend:** ⬜ Not Tested | ✅ Pass | ❌ Fail | ⚠️ Issue

---

## 🐛 Issue Reporting Template

If you find a bug:

```
**Test:** Test #X - [Test Name]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Steps to Reproduce:**
1. 
2. 
3. 

**Screenshot:** [If applicable]
**Browser:** [Chrome/Firefox/Safari/etc.]
**Console Errors:** [Any errors in console]
```

---

## ✅ Sign-Off

**Tested By:** ________________  
**Date:** ________________  
**Status:** ⬜ Pass | ⬜ Fail | ⬜ Needs Revision  
**Notes:**

---

**Ready for Production:** ⬜ Yes | ⬜ No  
**If No, Blockers:**

---

Good luck with testing! 🎉
