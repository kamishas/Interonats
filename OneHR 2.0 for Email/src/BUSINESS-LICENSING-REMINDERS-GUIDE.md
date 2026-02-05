# Business Licensing Automated Reminders - Quick Guide

## Overview
The Business Licensing module now includes a comprehensive automated reminder system that proactively notifies you about upcoming license renewals, tax filings, and corporate compliance deadlines.

## Features

### 1. **Automated Reminder Generation**
- Automatically creates reminders for:
  - License renewals
  - Tax account filings
  - Corporate filings (annual reports, registered agent renewals)
- Configurable reminder intervals (e.g., 30, 60, 90 days before expiry)
- Smart priority assignment based on urgency

### 2. **Configurable Settings**
Access via: **Business Licensing → Reminders → Settings**

**Key Configuration Options:**
- **Enable/Disable Reminders**: Toggle the entire reminder system
- **Auto-Generate**: Automatically create reminders for new items
- **Notification Method**: Choose email, in-app, or both
- **Custom Intervals**: Set specific reminder days for each type:
  - Licenses: Default 30, 60, 90 days before expiry
  - Tax Accounts: Default 15, 30 days before filing
  - Corporate Filings: Default 7, 14, 30 days before due date

### 3. **Reminder Dashboard**
Located at: **Business Licensing → Reminders**

**Quick Statistics:**
- Pending reminders count
- High priority items
- Reminders due this week
- Auto-generate status

**Reminder Table Features:**
- View all pending reminders sorted by date
- See item type, name, due date, and reminder date
- Priority badges (high/medium/low)
- Quick actions: Complete or dismiss reminders
- Days until reminder notification
- Color-coded urgency indicators

### 4. **Reminder Priority Levels**

**Licenses:**
- High: 30 days or less before expiry
- Medium: 31-60 days before expiry
- Low: 61-90 days before expiry

**Tax Accounts:**
- High: 15 days or less before filing
- Medium: 16-30 days before filing

**Corporate Filings:**
- High: 7 days or less before due date
- Medium: 8-14 days before due date
- Low: 15-30 days before due date

## How to Use

### Initial Setup
1. Go to **Business Licensing → Reminders**
2. Click **Settings** button
3. Configure your preferences:
   - Enable reminders
   - Turn on auto-generate
   - Set notification method
   - Customize reminder intervals
   - Add email recipients (optional)
4. Click **Save Settings**

### Generating Reminders
**Automatic:**
- When auto-generate is enabled, reminders are created automatically when:
  - New licenses are added
  - New tax accounts are registered
  - New filings are created
  - Existing items are updated

**Manual:**
- Click **Generate Reminders** button on the Reminders page
- System will scan all active items and create missing reminders

### Managing Reminders
**Complete a Reminder:**
- Click the checkmark icon ✓
- Marks reminder as completed
- Moves to reminder history

**Dismiss a Reminder:**
- Click the X icon
- Removes reminder from active list
- Records dismissal date in history

### Viewing Reminder History
- Scroll down on Reminders page
- See "Reminder History" section
- Shows last 10 completed/dismissed reminders
- Includes status and action date

## Reminder Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| Pending | Orange | Active reminder, waiting to be sent |
| Sent | Blue | Notification has been sent |
| Completed | Green | Action taken, reminder resolved |
| Dismissed | Gray | User manually dismissed |

## Time Indicators

| Display | Meaning |
|---------|---------|
| "Overdue" (Red) | Reminder date has passed |
| "Today" (Amber) | Reminder is due today |
| "in X days" (Orange) | Less than 7 days away |
| "in X days" (Gray) | More than 7 days away |

## Best Practices

### 1. **Set Appropriate Intervals**
- **Licenses**: Use 30, 60, 90 days for adequate renewal time
- **Tax Filings**: Use 15, 30 days for preparation and filing
- **Corporate Filings**: Use 7, 14, 30 days for quick turnaround items

### 2. **Regular Monitoring**
- Check Reminders page weekly
- Review high-priority items immediately
- Complete or dismiss reminders promptly

### 3. **Email Configuration**
- Add multiple recipients for redundancy
- Include compliance officers, legal team, finance
- Use distribution lists for team-wide notifications

### 4. **Auto-Generate Settings**
- Keep auto-generate ON for hands-off operation
- System will intelligently create reminders
- Avoids manual reminder creation

### 5. **Periodic Review**
- Regenerate reminders monthly to catch any gaps
- Review reminder settings quarterly
- Adjust intervals based on your team's workflow

## Integration with Other Modules

### Connected Data
- **Licenses Module**: Tracks expiry dates
- **Tax Accounts**: Monitors filing schedules
- **Filings & Reports**: Watches due dates
- **Recommendations**: Suggests proactive actions

### Automatic Updates
- When you update a license expiry date, reminders regenerate
- Adding new states triggers new compliance recommendations
- System syncs automatically with all compliance data

## Notification Methods

### In-App Notifications
- Displayed in the dashboard
- Real-time updates
- Badge counters on navigation

### Email Notifications
- Sent to configured recipients
- Includes item details and due dates
- Direct links to take action

### Both (Recommended)
- Maximum visibility
- Ensures notifications aren't missed
- Redundant alerting for critical items

## Troubleshooting

### No Reminders Showing
- Check if reminders are enabled in settings
- Verify auto-generate is turned on
- Click "Generate Reminders" button manually
- Ensure licenses/filings have valid dates

### Too Many Reminders
- Adjust reminder intervals
- Reduce number of days in settings
- Dismiss non-essential reminders
- Review duplicate items

### Missing Reminders
- Check if items have future expiry/due dates
- Reminders only created for dates within 120 days
- Manually regenerate reminders
- Verify item status is "active" or "pending"

## Technical Details

### Storage
- Reminders: `compliance-reminders` (KV store)
- Settings: `reminder-settings` (KV store)
- Persistent across sessions

### Data Refresh
- Reminders regenerate on data changes
- Settings apply immediately
- No page reload required

### Performance
- Optimized for large datasets
- Efficient duplicate prevention
- Smart date calculations

## Future Enhancements

Coming soon:
- SMS notifications
- Slack/Teams integration
- Calendar export (iCal format)
- Custom reminder templates
- Escalation rules
- Bulk reminder actions

## Quick Reference

**Access Reminders:**
Business Licensing → Overview → Reminders Card → Click

**Configure Settings:**
Reminders Page → Settings Button → Adjust → Save

**Generate Manually:**
Reminders Page → Generate Reminders Button

**Complete Reminder:**
Reminders Table → Checkmark Icon

**Dismiss Reminder:**
Reminders Table → X Icon

## Support

For questions or issues with the reminder system:
1. Check this guide first
2. Review reminder settings for proper configuration
3. Try manually regenerating reminders
4. Check the reminder history for past actions

---

**Last Updated:** November 2024
**Module:** Business Licensing Enhanced
**Feature:** Automated Reminders & Notifications
