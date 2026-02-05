# 🎯 Quick Visual Guide - Document Review Tab

## Where is it? 

### 📍 **Employees Module → Document Review Tab**

---

## Visual Navigation

```
┌─────────────────────────────────────────────────────────────────┐
│  OneHR                                             [User Menu]   │
├─────────────────────────────────────────────────────────────────┤
│  SIDEBAR                    │  MAIN CONTENT AREA                │
│                             │                                    │
│  🏠 Dashboard               │  Employees                         │
│  📋 Employees         ◄─────┼─ You are here!                   │
│  👥 Clients                 │                                    │
│  🌍 Immigration             │  ┌──────────────────────────────┐ │
│  💼 Projects                │  │  TABS:                        │ │
│  📊 Timesheets              │  │                               │ │
│  📄 Documents               │  │  [All Employees]              │ │
│  🎫 Business Licensing      │  │  [In Progress]                │ │
│  👷 Vendors                 │  │  [Completed]                  │ │
│  🔧 Settings                │  │  [Document Review (2)] ◄───── CLICK THIS!
│                             │  │         ↑                     │ │
│                             │  │    Orange badge               │ │
│                             │  │    = 2 pending docs           │ │
│                             │  └──────────────────────────────┘ │
│                             │                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## What You'll See After Clicking

### Empty State (No Pending Documents):

```
╔═══════════════════════════════════════════════════════════════╗
║  📄 Pending Document Reviews                                  ║
║  Review and approve employee-submitted documents              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║                          ✅                                    ║
║                    (green checkmark)                           ║
║                                                                ║
║                   All Caught Up!                               ║
║                                                                ║
║        No pending documents to review at this time.            ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

---

### With Pending Documents:

```
╔═══════════════════════════════════════════════════════════════╗
║  📄 Pending Document Reviews                                  ║
║  Review and approve employee-submitted documents              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │  👤 John Doe                                            │  ║
║  │  john.doe@company.com                  [🟠 2 pending]  │  ║
║  │  ────────────────────────────────────────────────────   │  ║
║  │                                                          │  ║
║  │  ┌────────────────────────────────────────────────┐    │  ║
║  │  │  📄 Employment Authorization Document (EAD)     │    │  ║
║  │  │                                                  │    │  ║
║  │  │  File: john_doe_ead.pdf                         │    │  ║
║  │  │  Uploaded: Nov 10, 2024 at 2:30 PM             │    │  ║
║  │  │  By: john.doe@company.com                       │    │  ║
║  │  │                                                  │    │  ║
║  │  │  Status: [🟠 Pending Review]                    │    │  ║
║  │  │                                                  │    │  ║
║  │  │  ┌──────────────┐  ┌─────────┐  ┌──────────┐  │    │  ║
║  │  │  │ 👁️ View      │  │ ✅ Approve│  │ ❌ Reject │  │    │  ║
║  │  │  │  Document    │  │          │  │          │  │    │  ║
║  │  │  └──────────────┘  └─────────┘  └──────────┘  │    │  ║
║  │  └────────────────────────────────────────────────┘    │  ║
║  │                                                          │  ║
║  │  ┌────────────────────────────────────────────────┐    │  ║
║  │  │  📄 Signed Offer Letter                         │    │  ║
║  │  │                                                  │    │  ║
║  │  │  File: offer_letter_signed.pdf                  │    │  ║
║  │  │  Uploaded: Nov 10, 2024 at 3:45 PM             │    │  ║
║  │  │  By: john.doe@company.com                       │    │  ║
║  │  │                                                  │    │  ║
║  │  │  Status: [🟠 Pending Review]                    │    │  ║
║  │  │                                                  │    │  ║
║  │  │  ┌──────────────┐  ┌─────────┐  ┌──────────┐  │    │  ║
║  │  │  │ 👁️ View      │  │ ✅ Approve│  │ ❌ Reject │  │    │  ║
║  │  │  │  Document    │  │          │  │          │  │    │  ║
║  │  │  └──────────────┘  └─────────┘  └──────────┘  │    │  ║
║  │  └────────────────────────────────────────────────┘    │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Button Actions

### 👁️ View Document
```
Click → Opens document in new browser tab → Review it
```

### ✅ Approve
```
Click → Shows toast: "EAD approved successfully!" → Document disappears from list
```

### ❌ Reject
```
Click → Popup asks: "Please provide a reason for rejection:"
     → Type reason: "Document expired" 
     → Click OK
     → Shows toast: "EAD rejected. Employee will be notified."
     → Employee must re-upload
```

---

## Tab Badge Explained

### Scenario 1: No Pending Documents
```
Tab appears as:  [Document Review]
```

### Scenario 2: 3 Documents Pending (from 2 different employees)
```
Tab appears as:  [Document Review (2)]
                                  ↑
                    Shows number of EMPLOYEES, not documents
```

**Why?**
- John has 2 pending docs → Counts as 1 employee
- Jane has 1 pending doc → Counts as 1 employee
- Badge shows: 2 (employees with pending docs)

---

## Complete Action Flow

```
START: HR logs in
   ↓
Clicks "Employees" in sidebar
   ↓
Sees tabs at top
   ↓
Notices "Document Review (2)" with orange badge
   ↓
Clicks "Document Review" tab
   ↓
Sees list of employees with pending documents
   ↓
Clicks "View Document" to review John's EAD
   ↓
PDF opens in new tab, HR reviews it
   ↓
Returns to OneHR, clicks "Approve"
   ↓
Toast appears: "EAD approved successfully!"
   ↓
Page refreshes, John's EAD disappears
   ↓
Badge updates to (1) - only Jane has pending docs now
   ↓
Continues reviewing Jane's document
   ↓
After all approved:
   ↓
Badge disappears, shows "All Caught Up!"
   ↓
END: All documents reviewed
```

---

## Color Guide

| Color | Meaning |
|-------|---------|
| 🟠 Orange | Pending Review (needs action) |
| ✅ Green | Approve button |
| ❌ Red | Reject button |
| 🔵 Blue | Document icon |
| ⚪ Gray | Document card background |

---

## Mobile View

On mobile/tablet, layout adapts:
```
┌─────────────────────────┐
│  Document Review (1)     │  ← Tab (scrollable)
├─────────────────────────┤
│                          │
│  👤 John Doe             │
│  john@company.com        │
│  [1 pending]             │
│  ──────────────────────  │
│                          │
│  📄 EAD Document         │
│                          │
│  File: ead.pdf           │
│  Uploaded: Nov 10        │
│                          │
│  [View]                  │  ← Buttons stack
│  [Approve]               │     vertically
│  [Reject]                │
│                          │
└─────────────────────────┘
```

---

## Screenshots (Conceptual)

### State 1: Empty
```
+-----------------------------------+
|  🎉 All Caught Up!                |
|                                   |
|  No documents to review.          |
+-----------------------------------+
```

### State 2: One Employee
```
+-----------------------------------+
|  John Doe (john@company.com)      |
|  [2 pending]                      |
|  -------------------------------- |
|  📄 EAD Document                  |
|  [View] [Approve] [Reject]        |
|  -------------------------------- |
|  📄 Signed Offer Letter           |
|  [View] [Approve] [Reject]        |
+-----------------------------------+
```

### State 3: Multiple Employees
```
+-----------------------------------+
|  John Doe                         |
|  📄 EAD [View] [Approve] [Reject] |
+-----------------------------------+
|  Jane Smith                       |
|  📄 NDA [View] [Approve] [Reject] |
+-----------------------------------+
|  Mike Johnson                     |
|  📄 Offer [View] [Approve] [Reject]|
+-----------------------------------+
```

---

## Quick Reference Card

```
┌──────────────────────────────────────────────────┐
│  DOCUMENT REVIEW TAB - QUICK REFERENCE           │
├──────────────────────────────────────────────────┤
│                                                   │
│  📍 Location: Employees > Document Review tab    │
│                                                   │
│  🔔 Badge: Shows # of employees with pending docs│
│                                                   │
│  👁️ View: Opens document in new tab              │
│                                                   │
│  ✅ Approve: Approves document, auto-refreshes   │
│                                                   │
│  ❌ Reject: Asks reason, notifies employee       │
│                                                   │
│  🔄 Refresh: Automatic after approve/reject      │
│                                                   │
│  🎯 Goal: Review & approve all onboarding docs   │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## Summary

**✅ You can see it at:** Employees → Document Review tab

**✅ What it does:** Shows all pending employee documents that need HR approval

**✅ How to use:** Click Approve or Reject for each document

**✅ Status:** Fully functional and ready to use!

---

**Last Updated:** November 10, 2024
