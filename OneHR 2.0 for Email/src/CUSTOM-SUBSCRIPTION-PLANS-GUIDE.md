# Custom Subscription Plans - User Guide

## 🎯 Overview

Product Admins can now create **custom subscription plans** in addition to the three default plans (Starter, Professional, Enterprise). This allows you to tailor subscription offerings to specific customer segments or use cases.

---

## ✨ New Features

### 1. **Create Custom Plans**
- Create unlimited custom subscription plans
- Define unique plan IDs and display names
- Set custom pricing and features
- Enable/disable plans at any time

### 2. **Duplicate Plans**
- Clone any existing plan (including default plans)
- Use as a template for quick setup
- Modify duplicated plans without affecting the original

### 3. **Delete Custom Plans**
- Remove custom plans that are no longer needed
- Default plans (Starter, Professional, Enterprise) cannot be deleted

---

## 🔑 Access

**Who can create custom plans:**
- Product Admin role only

**Location:**
- Login as Product Admin (`productadmin@company.com`)
- Navigate to **Subscription Config**
- Click **"Create Custom Plan"** button in the top right

---

## 📝 How to Create a Custom Plan

### Method 1: Create from Scratch

1. **Click "Create Custom Plan"** button
2. **Enter Plan ID:**
   - Unique identifier (e.g., `premium-plus`, `startup`)
   - Lowercase only
   - Use hyphens for spaces
   - Alphanumeric characters only
   - **Cannot be changed once created**

3. **Enter Plan Name:**
   - Display name shown to customers
   - Can include spaces and capitals (e.g., "Premium Plus")
   - Can be changed later

4. **Click "Create Plan"**

5. **The new plan tab will open automatically** with default settings:
   - Monthly Price: $0
   - Annual Price: $0
   - Max Employees: 10
   - Max Clients: 5
   - Document Storage: 5GB
   - All advanced features: Disabled

6. **Customize the plan:**
   - Set pricing
   - Configure usage limits
   - Enable/disable features
   - Write description and CTA

7. **Click "Save Changes"**

### Method 2: Duplicate an Existing Plan

1. **Navigate to any plan tab** (including default plans)
2. **Click "Duplicate" or "Duplicate as Custom Plan"** button
3. **Enter a unique Plan ID** when prompted
4. **The duplicated plan opens automatically**
5. **Modify as needed:**
   - Change name (defaults to "Plan Name (Copy)")
   - Adjust pricing
   - Update features
6. **Click "Save Changes"**

---

## 🎨 Custom Plan Configuration

Once created, custom plans have access to all the same settings as default plans:

### Basic Information
- Plan Name
- Description
- Call to Action button text
- Mark as "Popular" badge
- Enable/Disable plan visibility

### Pricing
- Monthly price ($)
- Annual price ($)
- Automatic savings calculation

### Usage Limits
- Maximum Employees (use 9999 for unlimited)
- Maximum Clients (use 9999 for unlimited)
- Document Storage (e.g., "50GB", "500GB", "Unlimited")
- Support SLA (e.g., "Standard", "Premium 24/5")

### Features & Capabilities
- ✅ Immigration Management
- ✅ Licensing Management
- ✅ Custom Workflows
- ✅ API Access
- ✅ SSO & SAML
- ✅ Custom Reports
- ✅ Audit Logs
- ✅ Advanced Analytics
- ✅ Multi-Company Support
- ✅ Dedicated Support

### Preview
- Real-time preview of how the plan appears to customers
- Shows pricing, features, and CTA button

---

## 🗑️ Deleting Custom Plans

**To delete a custom plan:**

1. Navigate to the custom plan's tab
2. Click **"Delete Plan"** button (top right, red text)
3. Confirm deletion in the popup dialog
4. The plan is permanently removed

**Important Notes:**
- Default plans (Starter, Professional, Enterprise) **cannot** be deleted
- Deletion is **permanent** and cannot be undone
- If organizations are using this plan, you should migrate them first
- After deletion, the view switches to the Starter plan tab

---

## 💡 Use Cases for Custom Plans

### 1. Industry-Specific Plans
**Example:** "Healthcare Edition"
- Tailored features for healthcare compliance
- HIPAA-focused documentation
- Specialized pricing for medical practices

### 2. Partner/Reseller Plans
**Example:** "Partner Premium"
- Custom pricing for channel partners
- Bulk discounts
- White-label features enabled

### 3. Non-Profit Plans
**Example:** "Non-Profit Tier"
- Discounted pricing for registered non-profits
- Limited feature set
- Special support options

### 4. Trial/Freemium Plans
**Example:** "Extended Trial"
- 60-day trial instead of 14-day
- Limited features
- Automatic upgrade prompts

### 5. Geographic Plans
**Example:** "APAC Business"
- Region-specific pricing
- Local compliance features
- Currency-specific display

### 6. Vertical Market Plans
**Example:** "Construction Pro"
- Features specific to construction industry
- Project-based billing
- Equipment tracking add-ons

---

## 🔧 Technical Details

### Plan ID Requirements
- **Format:** lowercase alphanumeric with hyphens
- **Valid:** `premium-plus`, `startup-2024`, `non-profit`
- **Invalid:** `Premium Plus`, `startup_tier`, `plan@1`
- **Uniqueness:** Must not conflict with existing plans
- **Immutability:** Cannot be changed after creation

### Plan Storage
- Custom plans are stored in the KV store
- Persisted with all default plans
- Loaded on server startup
- Synced across all Product Admin sessions

### Plan Availability
- Custom plans appear in:
  - Subscription Config tabs
  - Organization signup flow (if enabled)
  - Platform Analytics metrics
  - Revenue calculations

---

## 📊 Best Practices

### ✅ Do's

1. **Use descriptive Plan IDs**
   - Good: `enterprise-healthcare`, `startup-nonprofit`
   - Bad: `plan1`, `custom`, `test`

2. **Set appropriate pricing**
   - Consider cost-to-serve
   - Align with customer value
   - Maintain margin targets

3. **Enable selectively**
   - Create plan first
   - Configure fully
   - Test internally
   - Then enable for customers

4. **Document custom plans**
   - Keep notes on who the plan is for
   - Track which organizations use it
   - Note any special terms

5. **Review regularly**
   - Audit custom plans quarterly
   - Remove unused plans
   - Update pricing as needed

### ❌ Don'ts

1. **Don't create too many plans**
   - Leads to confusion
   - Harder to maintain
   - Analysis paralysis for customers

2. **Don't forget to save**
   - Watch for "Unsaved Changes" badge
   - Click "Save Changes" button
   - Verify success toast

3. **Don't duplicate plan IDs**
   - System will prevent this
   - Choose unique identifiers

4. **Don't delete in-use plans**
   - Check Platform Analytics first
   - Migrate organizations if needed
   - Communicate changes

---

## 🚀 Example Workflows

### Creating a Discounted Non-Profit Plan

1. Click "Create Custom Plan"
2. Plan ID: `nonprofit-tier`
3. Plan Name: `Non-Profit Edition`
4. Click "Create Plan"
5. Set Monthly Price: `$49` (50% off Starter)
6. Set Annual Price: `$490`
7. Set Max Employees: `25`
8. Set Max Clients: `10`
9. Description: `Special pricing for registered 501(c)(3) organizations`
10. CTA: `Apply for Non-Profit Pricing`
11. Enable Immigration Management: ✅
12. Save Changes

### Duplicating Enterprise for VIP Customers

1. Go to Enterprise plan tab
2. Click "Duplicate as Custom Plan"
3. Enter Plan ID: `vip-enterprise`
4. Plan opens automatically
5. Change name to "VIP Enterprise"
6. Set Monthly Price: `$1499` (premium tier)
7. Description: `Exclusive plan for strategic partners`
8. Enable all features
9. Set Max Employees: `9999` (unlimited)
10. Mark as Popular: ✅
11. Save Changes

---

## 📈 Analytics & Reporting

Custom plans are fully integrated into Platform Analytics:

### Metrics Tracked
- Number of organizations on each custom plan
- Revenue contribution per custom plan
- User counts for custom plan subscribers
- Trial vs. active status

### Subscription Tab
- Custom plans appear in the plan distribution chart
- Color-coded cards for each plan
- Organization count displayed

### Organizations Tab
- Shows which custom plan each org uses
- Filter/search by plan name
- Revenue breakdown includes custom plans

---

## ⚠️ Important Reminders

### Plan ID Cannot Be Changed
- Choose carefully during creation
- Changing requires creating a new plan
- Organizations would need to be migrated

### Save Before Switching Tabs
- Unsaved changes are lost when switching plans
- Yellow "Unsaved Changes" badge appears
- Always save before navigating away

### Deletion Is Permanent
- No undo functionality
- Backup plan configs if needed
- Migrate organizations first

### Default Plans Are Protected
- Starter, Professional, Enterprise cannot be deleted
- Can be disabled if needed
- Can be duplicated as custom plans

---

## 🔮 Future Enhancements

Planned features for custom plans:

- [ ] Plan templates library
- [ ] Import/export plan configurations
- [ ] Plan usage analytics
- [ ] Automated plan suggestions based on customer behavior
- [ ] Plan versioning and history
- [ ] Bulk plan management
- [ ] Plan comparison tool for customers
- [ ] A/B testing for plan features

---

## 📞 Common Questions

**Q: How many custom plans can I create?**  
A: Unlimited! However, we recommend keeping it manageable (5-10 total plans).

**Q: Can customers see custom plans?**  
A: Only if the plan is enabled. Disabled plans are hidden from signup.

**Q: Can I rename a plan after creation?**  
A: You can change the display name, but not the plan ID.

**Q: What happens if I delete a plan that organizations are using?**  
A: You should migrate organizations to a different plan first. The system will allow deletion, but those organizations will need a new plan assigned.

**Q: Can I have different features in custom plans?**  
A: Yes! Every plan can have a unique combination of enabled/disabled features.

**Q: Do custom plans show in revenue calculations?**  
A: Yes! Custom plans are fully integrated into all analytics and revenue tracking.

**Q: Can I change pricing after organizations subscribe?**  
A: Yes, but it's recommended to grandfather existing customers at their original price. Future feature: pricing lock-in per organization.

**Q: Is there a "free" custom plan option?**  
A: Yes, set monthly and annual prices to $0.

---

## ✨ Summary

Custom subscription plans give Product Admins the flexibility to:

- 🎯 **Target specific customer segments** with tailored plans
- 💰 **Experiment with pricing strategies** without affecting defaults
- 🚀 **Launch promotional tiers** quickly
- 🤝 **Create partner/reseller programs** with custom pricing
- 🌍 **Adapt to regional markets** with localized offerings
- 📊 **A/B test** different feature combinations

**Get started:** Login as Product Admin → Subscription Config → Create Custom Plan

---

**Happy plan crafting! 🎉**
