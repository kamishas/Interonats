# Quick Reference Guide

## 🚀 New Features Quick Access

### How to Access New Modules

**After logging in as Admin/HR:**

1. **Documents** → Sidebar → Employee Management → Documents
2. **Leave & PTO** → Sidebar → Employee Management → Leave & PTO
3. **Performance** → Sidebar → Employee Management → Performance
4. **Offboarding** → Sidebar → Employee Management → Offboarding

---

## 📱 Common Tasks

### Upload a Document
1. Documents → "Upload Document" button
2. Select employee
3. Choose document type
4. Upload file (max 10MB)
5. Set expiry date (optional)
6. Mark if signature required
7. Click "Upload"

### Create Leave Request
1. Leave & PTO → "New Request" button
2. Select employee
3. Choose leave type
4. Select start/end dates
5. Enter reason
6. Click "Submit Request"

### Approve Leave Request
1. Leave & PTO → Find request in table
2. Click approve ✓ or reject ✗ button
3. For rejection, enter reason

### Create Performance Review
1. Performance → "New Review" button
2. Select employee and reviewer
3. Choose review cycle
4. Rate across 7 categories
5. Add feedback (strengths, improvements, accomplishments)
6. Add goals and recommendations
7. Click "Create Review"

### Initiate Offboarding
1. Offboarding → "Initiate Offboarding" button
2. Select employee
3. Set last working date
4. Choose reason
5. Add details
6. Enter your name
7. Click "Initiate Offboarding"

---

## 🎯 Quick Stats (Dashboard)

**View real-time metrics:**
- Total Employees
- In Onboarding
- Completed
- Tasks Pending
- Documents
- Leave Requests
- Performance Reviews
- Offboarding

**View alerts for:**
- Immigration docs expiring
- State licensing needed
- Documents expiring
- Pending signatures
- Pending leave requests
- Active offboarding

---

## 🔐 Default Credentials

**Admin:**
- Email: admin@company.com
- Password: admin123

**HR:**
- Email: hr@company.com
- Password: hr123

**Employee:**
- Email: john.doe@company.com
- Password: employee123

---

## 📊 Module Overview

### Documents
- **What:** Manage employee documents
- **Who:** Admin, HR, Manager
- **Key Features:** Upload, expire, sign, search

### Leave & PTO
- **What:** Track time off requests
- **Who:** Admin, HR, Manager (approve); Employees (request)
- **Key Features:** 9 leave types, approval workflow, balance tracking

### Performance
- **What:** Employee reviews and goals
- **Who:** Admin, HR, Manager
- **Key Features:** 7 categories, goals, recommendations

### Offboarding
- **What:** Employee exit process
- **Who:** Admin, HR
- **Key Features:** Tasks, assets, approvals, exit interview

---

## 🛠️ Troubleshooting

**Can't see new modules?**
- Check you're logged in as Admin/HR
- Check sidebar "Employee Management" section

**Upload fails?**
- Check file size (max 10MB)
- Check file type (PDF, DOC, JPG, PNG)

**Can't approve leave?**
- Check request status is "pending"
- Check you have Manager/HR role

**Dashboard not showing data?**
- Refresh page
- Check console for errors
- Verify backend is running

---

## 📁 File Locations

**Components:**
```
/components/document-management.tsx
/components/leave-management.tsx
/components/offboarding.tsx
/components/performance-management.tsx
/components/dashboard.tsx (updated)
/App.tsx (updated)
```

**Backend:**
```
/supabase/functions/server/index.tsx (16 new endpoints)
```

**Types:**
```
/types/index.ts (all type definitions)
```

---

## 📞 Support

**Full Documentation:**
- `/NEW-FEATURES-IMPLEMENTED.md` - Detailed features
- `/INTEGRATION-COMPLETE.md` - Integration guide
- `/FINAL-IMPLEMENTATION-SUMMARY.md` - Complete summary

**Quick Guides:**
- `/QUICK-START.md` - Getting started
- `/EMPLOYEE-LOGIN-GUIDE.md` - Employee portal
- `/WORKFLOW-QUICK-GUIDE.md` - Onboarding workflow

---

## ✅ Quick Checklist

**First Time Setup:**
- [ ] Login as Admin
- [ ] View Dashboard
- [ ] Navigate to each new module
- [ ] Upload test document
- [ ] Create test leave request
- [ ] Create test performance review
- [ ] Initiate test offboarding

**Daily Operations:**
- [ ] Check Dashboard alerts
- [ ] Review pending leave requests
- [ ] Check expiring documents
- [ ] Monitor onboarding progress
- [ ] Track offboarding tasks

---

## 🎯 Common Workflows

**New Employee:**
1. Employee Onboarding → Add Employee
2. Upload documents (I-9, W-4, etc.)
3. Progress through 7 workflow stages
4. Get department approvals
5. Employee gains timesheet access

**Employee Leave:**
1. Employee requests leave
2. Manager reviews request
3. Manager approves/rejects
4. PTO balance updated
5. Leave tracked in calendar

**Annual Review:**
1. Create performance review
2. Rate employee performance
3. Set goals for next period
4. Make recommendations
5. Get signatures
6. Complete review

**Employee Exit:**
1. Initiate offboarding
2. Schedule exit interview
3. Track asset returns
4. Complete tasks
5. Get approvals
6. Process final paycheck

---

**Last Updated:** December 2024  
**Version:** 1.0 - Complete  
**Status:** Production Ready
