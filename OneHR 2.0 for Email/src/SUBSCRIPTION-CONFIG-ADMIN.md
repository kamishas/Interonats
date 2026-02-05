# Subscription Configuration Admin Panel

## Overview
The Subscription Configuration admin panel allows super admins and admins to configure subscription tiers, pricing, and feature access for the platform.

## Location
**Navigation:** Admin Tools → Subscription Config (visible only to admin and super_admin roles)

## Features

### 1. **Multi-Tier Management**
Configure three subscription tiers:
- **Starter** - Entry-level plan for small businesses
- **Professional** - Mid-tier plan with advanced features (marked as "Popular")
- **Enterprise** - Full-featured plan for large organizations

### 2. **Plan Configuration**

#### Basic Information
- **Plan Name** - Display name of the plan
- **Description** - Brief description shown to customers
- **Call to Action Button** - Button text (e.g., "Start Free Trial", "Contact Sales")
- **Mark as Popular** - Toggle to highlight a plan with a "Most Popular" badge
- **Plan Enabled** - Toggle to show/hide plan from customers

#### Pricing
- **Monthly Price** - Price per month in USD
- **Annual Price** - Price per year in USD
- Automatic calculation of:
  - Monthly equivalent for annual plans
  - Savings percentage when billed annually

#### Usage Limits
- **Maximum Employees** - Employee limit (use 9999 for unlimited)
- **Maximum Clients** - Client limit (use 9999 for unlimited)
- **Document Storage** - Storage quota (e.g., "10GB", "100GB", "Unlimited")
- **Support SLA** - Service level agreement description

### 3. **Feature Access Control**

Toggle features on/off for each plan:
- ✅ **Immigration Management** - Access to immigration tracking and compliance
- ✅ **Licensing Management** - Business license tracking and renewals
- ✅ **Custom Workflows** - Create and customize approval workflows
- ✅ **API Access** - Programmatic access to platform data
- ✅ **SSO & SAML** - Single sign-on integration
- ✅ **Custom Reports** - Build custom reports and analytics
- ✅ **Audit Logs** - Detailed activity and compliance logs
- ✅ **Advanced Analytics** - In-depth analytics and insights
- ✅ **Multi-Company Support** - Manage multiple organizations
- ✅ **Dedicated Support** - Priority customer support

### 4. **Live Preview**
Real-time preview shows how the plan will appear to customers, including:
- Plan name and description
- Pricing display
- Popular badge (if enabled)
- Feature list
- Call-to-action button

### 5. **Change Tracking**
- **Unsaved Changes Badge** - Visual indicator when changes are pending
- **Save Changes** - Persist configuration to database
- **Reset to Defaults** - Restore original configuration (with confirmation)

## How to Use

### Editing a Plan
1. Navigate to **Admin Tools → Subscription Config**
2. Select a plan tab (Starter, Professional, or Enterprise)
3. Edit any fields in the following sections:
   - Basic Information
   - Pricing
   - Usage Limits
   - Features & Capabilities
4. Review the live preview
5. Click **Save Changes** to persist

### Setting Unlimited Limits
Use `9999` for unlimited employees or clients
Use `"Unlimited"` text for unlimited storage

### Pricing Best Practices
- Annual pricing typically offers 15-20% savings vs monthly
- The system automatically calculates and displays savings percentage
- Monthly equivalent is shown for annual plans

### Feature Recommendations

**Starter Tier:**
- Basic features only
- Limited employees/clients
- Standard support
- No premium features

**Professional Tier:**
- Mid-range limits
- Most features enabled
- Priority support
- Mark as "Popular" for visibility

**Enterprise Tier:**
- Unlimited or very high limits
- All features enabled
- 24/7 support
- Premium support SLA

## Technical Details

### Backend Endpoints
- **GET** `/make-server-f8517b5b/subscription-config` - Load configuration
- **PUT** `/make-server-f8517b5b/subscription-config` - Save configuration

### Data Storage
Configuration is stored in the key-value store:
- Key: `subscription:plan-config`
- Format: JSON object with plan configurations

### Audit Trail
All configuration changes are logged:
- Action: `subscription_config_updated`
- Timestamp: ISO 8601 format
- Stored with prefix: `audit:`

### Default Configuration
If no custom configuration exists, the system returns default settings for all three plans.

## Access Control
- **Accessible by:** admin, super_admin only
- **Protected:** Other roles see "Access Denied"
- **Navigation:** Hidden from non-admin users

## Integration

The subscription configuration integrates with:
1. **Signup Process** - New organizations select from available plans
2. **Pricing Page** - Public-facing pricing display
3. **Feature Gating** - Controls which features are available per tier
4. **Billing System** - Determines pricing for invoices

## Future Enhancements

Potential future additions:
- Custom tier creation
- Add-on modules and pricing
- Usage-based pricing options
- Trial period configuration
- Discount codes and promotions
- Multi-currency support
- Regional pricing
- Feature usage analytics per tier

## Notes

- Changes take effect immediately after saving
- Existing subscriptions are not automatically updated
- Plan configuration is separate from individual organization subscriptions
- Use caution when disabling features that existing customers may rely on
- Consider grandfathering existing customers when making significant changes
