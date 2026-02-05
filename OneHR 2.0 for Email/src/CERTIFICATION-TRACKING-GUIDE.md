# Certification Tracking Module - Quick Guide

## Overview
The Certification Tracking module has been added under the **Compliance** section, allowing you to track employee certifications, expiration dates, renewal dates, and set up automatic reminders.

## Access
- **Navigation**: Compliance → Certifications
- **Permissions**: Requires `canManageLicensing` permission (same as Business Licensing)
- **Available to**: Admin, Super Admin, Licensing personnel

## Key Features

### 1. Certification Management
- Track certifications by employee or as general (company-wide) certifications
- Record certification type, name, and issuing organization
- Store certification numbers for reference
- Upload supporting documents (certificates, PDFs)

### 2. Date Tracking
**Required fields:**
- **Start Date**: When the certification was obtained
- **Expiration Date**: When the certification expires
- **Certification Renewal Date**: Target date for renewal process

### 3. Reminder System
Configure automatic reminders before certification expiration:
- ✅ **90 days** before expiration
- ✅ **60 days** before expiration
- ✅ **30 days** before expiration
- ✅ **10 days** before expiration
- ✅ **5 days** before expiration
- ✅ **1 day** before expiration

**Default**: All reminder options are pre-selected when adding a new certification
**Customizable**: Toggle any reminder option on/off based on your needs

### 4. Status Tracking
Certifications are automatically categorized based on expiration date:
- 🟢 **Active**: More than 90 days until expiration
- 🟡 **Pending Renewal**: 31-90 days until expiration
- 🟠 **Expiring Soon**: 1-30 days until expiration
- 🔴 **Expired**: Past the expiration date

### 5. Dashboard Tabs

#### Overview Tab
- Statistics cards showing active, pending renewal, expiring soon, and expired certifications
- Recent certifications table
- Days until expiry countdown

#### All Certifications Tab
- Complete list of all certifications
- Search functionality (by employee, certification type, issuing org)
- Filter by status
- Edit and delete actions

#### Expiring Soon Tab
- Focused view of certifications requiring immediate attention
- Sorted by days remaining (most urgent first)
- Quick access to renewal actions

## Adding a Certification

1. Click **"Add Certification"** button
2. Fill in the form:
   - **Employee** (optional): Select an employee or leave as "General"
   - **Certification Type** (required): e.g., PMP, CPA, SHRM-CP, CPR
   - **Certification Name** (optional): Full name of certification
   - **Issuing Organization** (optional): e.g., PMI, AICPA, SHRM
   - **Certification Number** (optional): ID or certificate number
   - **Start Date** (required): Date certification was obtained
   - **Expiration Date** (required): When it expires
   - **Certification Renewal Date** (required): Target renewal date
   - **Reminder Settings**: Select which reminder intervals you want (default: all selected)
   - **Document Upload** (optional): Attach the certificate PDF/image
   - **Notes** (optional): Additional information

3. Click **"Add Certification"** to save

## Editing a Certification

1. Find the certification in the table
2. Click the **Edit** icon (pencil)
3. Update the fields as needed
4. Adjust reminder settings if required
5. Click **"Update Certification"**

## Deleting a Certification

1. Find the certification in the table
2. Click the **Delete** icon (trash can)
3. Confirm the deletion

## Alert System

The module displays alert banners for:
- **Critical**: Expired certifications (red banner)
- **Warning**: Certifications expiring within 30 days (orange banner)

## Use Cases

### Employee-Specific Certifications
- Professional licenses (CPA, PE, RN)
- Industry certifications (PMP, Six Sigma, CISSP)
- Safety certifications (First Aid, CPR, OSHA)
- Training completions

### Company-Wide Certifications
- Business licenses
- Insurance certifications
- Compliance certifications
- Quality certifications (ISO, etc.)

## Integration Points

### With Employee Module
- Link certifications to specific employees
- View employee certification status

### With Licensing Module
- Shared permission structure
- Complementary compliance tracking

### Future Enhancements
- Automatic email notifications based on reminder settings
- Certification history and renewal tracking
- Bulk certification management
- Custom certification types and categories

## Best Practices

1. **Set Multiple Reminders**: Use the 90, 60, 30 day reminders for critical certifications
2. **Document Everything**: Upload certificate copies for reference
3. **Regular Reviews**: Check the "Expiring Soon" tab weekly
4. **Employee Assignment**: Link certifications to employees for better tracking
5. **Renewal Dates**: Set renewal dates earlier than expiration to allow processing time

## Example Certifications to Track

### HR & Compliance
- SHRM-CP, SHRM-SCP
- PHR, SPHR
- Safety certifications

### Accounting & Finance
- CPA licenses
- CMA certifications
- Tax preparer licenses

### IT & Technology
- CompTIA certifications
- Cisco certifications
- Cloud certifications (AWS, Azure)

### Healthcare
- Medical licenses
- Nursing certifications
- CPR/First Aid

### Project Management
- PMP, CAPM
- Agile/Scrum certifications
- Six Sigma belts

## API Endpoints

All endpoints are available at: `https://{projectId}.supabase.co/functions/v1/make-server-f8517b5b`

- **GET** `/certifications` - Get all certifications
- **GET** `/certifications/:id` - Get single certification
- **POST** `/certifications` - Create new certification
- **PUT** `/certifications/:id` - Update certification
- **DELETE** `/certifications/:id` - Delete certification
- **POST** `/upload-certification-document` - Upload certificate document

## Summary

The Certification Tracking module provides:
✅ Complete certification lifecycle management
✅ Flexible reminder system (90, 60, 30, 10, 5, 1 days)
✅ Automatic status calculation
✅ Document storage
✅ Employee-specific or general certifications
✅ Compliance alerts and notifications
✅ Easy search and filtering

Navigate to **Compliance → Certifications** to start tracking your certifications today!
