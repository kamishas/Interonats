# State Licensing - Hierarchical Structure

## Overview
Successfully reorganized the licensing system to create a hierarchical State Licensing module where each state contains multiple license types and accounts. Only one state can be designated as "Primary" (incorporation state), and all others are "Foreign" (out-of-state).

## New Structure

### Business Licensing (Federal & Client)
- **Federal Licenses** - Nationwide registrations (EIN, SAM.gov, E-Verify)
- **Client State Licenses** - Client-specific registrations (Vendor ID, MBE/SBE, BEP)

### State Licensing (NEW - Hierarchical)
Each state entry contains:
1. **State Information**
   - State name
   - Primary/Foreign designation (only 1 primary allowed)
   - State ID
   - Active employees count

2. **Withholding Account**
   - Portal URL
   - Account Number
   - Username
   - Password
   - UI Rate (%)

3. **UI Account**
   - Portal URL
   - Account Number  
   - UI Rate (%)

4. **Workers Compensation**
   - Registered status (Yes/No)
   - Filing Service (e.g., Incfile)
   - Company Name
   - Company Address
   - Policy Number
   - Expiry Date

5. **County/Local Licensing** (Multiple entries)
   - City
   - County
   - Local License Number
   - Issue Date
   - Expiry Date
   - Fee
   - Status

## Key Features

### Primary State Management
- **Only ONE state can be Primary** - System enforces this rule
- Primary state badge with yellow star icon
- "Set Primary" button for foreign states
- Automatic validation prevents multiple primary states

### Hierarchical Display
- **Expandable/Collapsible States** - Click to expand/collapse
- Primary state sorted first, then alphabetical
- Shows summary info when collapsed:
  - Active employees count
  - Quick indicators for Withholding, UI, Workers Comp, Local Licenses
- Shows full details when expanded

### Stats Dashboard
- Total States count
- Primary State name (with star icon)
- Foreign States count
- Total Active Employees across all states

### State-by-State Management
Each state card displays:
- **Header (Collapsed View):**
  - State name
  - Primary/Foreign badge
  - State ID (if set)
  - Quick stats (employees, accounts present)
  - Action buttons (Set Primary, View, Edit, Delete)

- **Expanded View:**
  - Withholding Account details
  - UI Account details
  - Workers Compensation info
  - All County/Local licenses
  - Notes

### Add/Edit State Dialog
**Tabbed Interface:**
1. **Basic Tab**
   - State selection (dropdown of all US states)
   - Primary state toggle switch
   - State ID field
   - Active employees count
   - Notes

2. **Withholding Tab**
   - Portal URL
   - Account Number
   - Username
   - Password (hidden)
   - UI Rate (%)

3. **UI Tab**
   - Portal URL
   - Account Number
   - UI Rate (%)

4. **Workers Comp Tab**
   - Registered toggle
   - Filing Service
   - Company Name
   - Company Address
   - Policy Number

5. **County/Local Tab**
   - Placeholder for adding local licenses
   - (Can be managed after state creation)

### Data Organization

**Before (Flat Structure):**
```
├── Federal Licenses
├── Primary State Licenses
├── County/Local Licenses
├── Foreign State Licenses
├── Client State Licenses
└── Local Withholding Accounts
```

**After (Hierarchical Structure):**
```
Business Licensing:
├── Federal Licenses
└── Client State Licenses

State Licensing:
├── Virginia (PRIMARY)
│   ├── Withholding Account
│   ├── UI Account
│   ├── Workers Comp
│   └── County/Local Licenses
│       ├── Fairfax County License
│       └── Arlington County License
├── New York (Foreign)
│   ├── Withholding Account
│   ├── UI Account
│   └── County/Local Licenses
└── California (Foreign)
    └── ... (same structure)
```

## Benefits

### 1. **Clear Hierarchy**
- All state-related items grouped under each state
- Easy to see what's registered in each state
- No confusion about primary vs foreign states

### 2. **Better Organization**
- All accounts for a state in one place
- No need to search multiple categories
- Logical grouping by jurisdiction

### 3. **Enforced Rules**
- Only one primary state (system enforced)
- Can't accidentally set multiple primary states
- Clear validation messages

### 4. **Easier Expansion**
- Adding a new state is simple
- All related accounts/licenses stay together
- Template structure for consistency

### 5. **Improved Navigation**
- Expand/collapse for focused viewing
- Quick stats visible without expanding
- Search across all states

## Usage Guide

### Setting Up States

**1. Add Primary State:**
```
1. Click "Add State"
2. Select your incorporation state (e.g., Virginia)
3. Toggle "Designate as Primary State" ON
4. Fill in State ID if applicable
5. Add employee count
6. Go to Withholding tab → add account info
7. Go to UI tab → add account info
8. Go to Workers Comp tab → add insurance info
9. Save
```

**2. Add Foreign States:**
```
1. Click "Add State"
2. Select the state (e.g., New York)
3. Leave "Primary" toggle OFF
4. Fill in relevant tabs
5. Save
```

**3. Change Primary State:**
```
1. Find the state you want to make primary
2. Click "Set Primary" button
3. System automatically unsets old primary
4. New state becomes primary
```

### Managing State Licenses

**View State Details:**
- Click expand arrow (▶) to show all info
- Or click eye icon for dialog view

**Edit State:**
- Click edit icon
- Same tabbed form as Add
- Update any fields
- Can change primary status

**Delete State:**
- Click trash icon
- Confirm deletion
- Removes state and all nested licenses

### Search & Filter
- Use search bar to find states by name or ID
- States auto-sorted: Primary first, then alphabetical
- Expand all states with issues/alerts

## Data Structure

```typescript
interface StateLicensing {
  id: string;
  state: string;                    // State name
  isPrimary: boolean;                // Only 1 can be true
  stateId?: string;                  // State identification
  
  // Nested accounts
  withholdingAccount?: {
    url?: string;
    accountNumber?: string;
    userName?: string;
    password?: string;
    uiRate?: number;
    status: 'active' | 'inactive' | 'pending';
  };
  
  uiAccount?: {
    url?: string;
    accountNumber?: string;
    uiRate?: number;
    status: 'active' | 'inactive' | 'pending';
  };
  
  workersComp?: {
    registered: boolean;
    filingService?: string;
    companyName?: string;
    companyAddress?: string;
    policyNumber?: string;
    expiryDate?: string;
    status: 'active' | 'inactive' | 'pending';
  };
  
  countyLocalLicenses: Array<{
    city?: string;
    county?: string;
    localLicenseNumber?: string;
    expiryDate?: string;
    fee?: number;
    status: 'active' | 'expired' | 'pending';
  }>;
  
  activeEmployees: number;
  notes?: string;
}
```

## API Endpoints

- `GET /state-licenses` - Fetch all states
- `POST /state-licenses` - Create new state
- `PUT /state-licenses/:id` - Update state
- `DELETE /state-licenses/:id` - Delete state

## Navigation

**Updated Sidebar:**
```
CORE MODULES
├── Employees
├── Clients
├── Projects
├── Vendors
├── Subvendors
├── Contractors
├── Immigration
├── Business Licensing  ← Federal & Client State only
└── State Licensing     ← NEW - State hierarchy
```

## Visual Indicators

### Primary State
- Yellow border on card
- Star icon (filled) next to name
- "Primary" badge in yellow

### Foreign States
- Standard border
- "Foreign" badge (outline)
- "Set Primary" button visible

### Account Status
- Green checkmark if account exists
- Shows in collapsed view summary

### Expandable States
- ▶ when collapsed
- ▼ when expanded
- Click anywhere on header to toggle

## Examples

### Primary State (Virginia)
```
⭐ Virginia [Primary] [#VA-12345]
├─ 👥 45 Active Employees
├─ ✓ Withholding Account
├─ ✓ UI Account
├─ ✓ Workers Comp
└─ ✓ 2 Local Licenses

[Expanded View Shows:]
┌─ Withholding Account
│  URL: https://www.vatax.gov
│  Account #: 123456789
│  Username: company@email.com
│  UI Rate: 2.54%
│
├─ UI Account
│  URL: https://www.vec.virginia.gov
│  Account #: UI-987654
│  UI Rate: 1.34%
│
├─ Workers Compensation
│  Registered: Yes
│  Filing Service: Incfile
│  Company: ACME Insurance Co.
│  Policy #: WC-123456
│
└─ County/Local Licensing
   ├─ Fairfax County
   │  License #: FC-2024-001
   │  Expires: Dec 31, 2024
   └─ Arlington County
      License #: ARL-2024-456
      Expires: Jun 30, 2025
```

### Foreign State (New York)
```
New York [Foreign] [#NY-98765]
├─ 👥 12 Active Employees
├─ ✓ Withholding Account
├─ ✓ UI Account
└─ ✗ Workers Comp (Not Registered)

[Set Primary] [View] [Edit] [Delete]
```

## Compliance Benefits

### Easy Audit
- All state info in one place
- Can quickly see registration status
- Export capability (future enhancement)

### Expiration Tracking
- Track local license expirations
- Workers comp policy renewals
- Automated reminders (future)

### Employee Tracking
- See how many employees per state
- Helps determine nexus requirements
- Supports expansion planning

## Migration from Old Structure

### Old Categories → New Structure:
- `primary_state` licenses → Primary State entry
- `county_local` licenses → County/Local within state
- `foreign` licenses → Foreign State entries
- `local_withholding` accounts → Withholding Account within state

### Migration Steps:
1. Create state entries for each unique state
2. Designate one as primary
3. Move licenses to appropriate state
4. Populate account fields
5. Verify all data migrated

## Future Enhancements

### Planned Features:
- [ ] Auto-detect primary state from company profile
- [ ] Import state data from CSV
- [ ] County/Local license management within state
- [ ] Expiration reminders
- [ ] Compliance dashboard per state
- [ ] State-specific document storage
- [ ] Integration with state portals
- [ ] Multi-state employee assignment tracking
- [ ] Tax calculation based on state rates

## Summary

✅ **Hierarchical Organization** - Each state contains all its licenses/accounts
✅ **Primary State Enforcement** - Only one primary, system-enforced
✅ **Expandable Interface** - Show/hide details as needed
✅ **Comprehensive Accounts** - Withholding, UI, Workers Comp, Local all tracked
✅ **Employee Tracking** - See headcount per state
✅ **Easy Navigation** - Search, sort, expand/collapse
✅ **Clean Separation** - Federal & Client State licenses separate
✅ **Scalable Design** - Easy to add new states

The State Licensing module now provides a clear, hierarchical structure that matches real-world compliance requirements, making it easy to manage multi-state operations while ensuring only one state is designated as the primary incorporation state.
