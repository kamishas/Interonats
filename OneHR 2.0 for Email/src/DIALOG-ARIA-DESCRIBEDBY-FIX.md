# Dialog aria-describedby Fix Required

## Problem
You're seeing this warning: `Warning: Missing 'Description' or 'aria-describedby={undefined}' for {DialogContent}.`

## Root Cause
We've been manually adding `aria-describedby="some-id"` to DialogContent components, but Radix UI AUTOMATICALLY connects DialogDescription to DialogContent. By manually specifying aria-describedby, we're interfering with Radix's automatic accessibility wiring.

## Solution
**REMOVE all manual `aria-describedby` attributes from DialogContent components throughout the codebase.**

Radix UI expects ONE of these patterns:
1. Use DialogDescription (Radix auto-wires it) - **This is what we should use**
2. Explicitly set `aria-describedby={undefined}` (for dialogs that truly don't need descriptions)

## Correct Pattern

### ❌ INCORRECT (what we currently have):
```tsx
<DialogContent className="max-w-2xl" aria-describedby="my-dialog-description">
  <DialogHeader>
    <DialogTitle>Title</DialogTitle>
    <DialogDescription id="my-dialog-description">
      Description text
    </DialogDescription>
  </DialogHeader>
</DialogContent>
```

### ✅ CORRECT (what we need):
```tsx
<DialogContent className="max-w-2xl">
  <DialogHeader>
    <DialogTitle>Title</DialogTitle>
    <DialogDescription>
      Description text
    </DialogDescription>
  </DialogHeader>
</DialogContent>
```

## Files That Need Updates

Search for `aria-describedby=` in these files and REMOVE the attribute:

1. `/components/dashboard.tsx` - ✅ FIXED (alerts dialog, still need reports + employee + client dialogs)
2. `/components/employee-onboarding.tsx`
3. `/components/client-onboarding.tsx`  
4. `/components/immigration-management.tsx`
5. `/components/business-licensing.tsx`
6. `/components/timesheets.tsx`
7. `/components/immigration-employee-form.tsx`
8. `/components/immigration-case-form.tsx`
9. `/components/immigration-cost-form.tsx`
10. `/components/immigration-dependent-form.tsx`
11. `/components/document-management.tsx`
12. `/components/leave-management.tsx`
13. `/components/offboarding.tsx`
14. `/components/performance-management.tsx`
15. `/components/document-collection-panel.tsx`
16. `/components/employee-document-upload.tsx`
17. `/components/employee-immigration-portal.tsx`
18. `/components/immigration-case-form-enhanced.tsx`
19. `/components/immigration-attorney-integration.tsx`
20. `/components/project-assignments.tsx`
21. `/components/employee-project-view.tsx`
22. `/components/client-onboarding-enhanced.tsx`
23. `/components/client-management-advanced.tsx`
24. `/components/vendor-management.tsx`
25. `/components/subvendor-management.tsx`
26. `/components/contractor-management.tsx`
27. `/components/dashboard-settings.tsx`
28. `/components/business-licensing-enhanced.tsx`

## Commands to Help

### Find all instances:
```bash
grep -r "aria-describedby=" components/
```

### Count instances:
```bash
grep -r "aria-describedby=" components/ | wc -l
```

## Important Notes

- Keep the DialogDescription component and its content
- Only remove the `aria-describedby` attribute from DialogContent
- Do NOT remove the `id` attribute from DialogDescription (it doesn't hurt, though Radix doesn't need it)
- The DialogDescription content must not be empty or undefined

## Status
- ✅ dashboard.tsx alerts dialog fixed
- ⏳ Remaining ~55+ DialogContent instances need fixing

This is a mechanical find-and-replace task across all component files.
