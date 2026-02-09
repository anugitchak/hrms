# Country and Sub-Company Management - SuperAdmin Guide

## How to Access

1. **Login as SuperAdmin**
   - Email: admin@hrms.com
   - Password: password
   - Country: India (optional for SuperAdmin)
   - Sub-Company: WOWL edtech (optional for SuperAdmin)

2. **Navigate to Management Pages**
   - After login, you'll see the SuperAdmin dashboard
   - In the sidebar menu, find:
     - **Countries** - Manage all countries
     - **Sub-Companies** - Manage sub-companies

## Managing Countries

### Add New Country
1. Click on **Countries** in the sidebar
2. Click **+ Add Country** button
3. Fill in:
   - **Country Name**: e.g., "United States"
   - **Country Code**: e.g., "US" (2-10 characters)
   - **Active**: Check to make it available for login
4. Click **Create**

### Edit Country
1. Find the country in the table
2. Click **Edit** button
3. Update the fields
4. Click **Update**

### Delete Country
1. Find the country in the table
2. Click **Delete** button
3. Confirm deletion
   - **Note**: Cannot delete if sub-companies exist

## Managing Sub-Companies

### Add New Sub-Company
1. Click on **Sub-Companies** in the sidebar
2. Click **+ Add Sub-Company** button
3. Fill in:
   - **Sub-Company Name**: e.g., "WOWL edtech Mumbai"
   - **Sub-Company Code**: e.g., "WOWL-MUM"
   - **Country**: Select from dropdown
   - **Active**: Check to make it available
4. Click **Create**

### Edit Sub-Company
1. Find the sub-company in the table
2. Click **Edit** button
3. Update the fields
4. Click **Update**

### Delete Sub-Company
1. Find the sub-company in the table
2. Click **Delete** button
3. Confirm deletion
   - **Note**: Cannot delete if employees are assigned

## Current Data

### Existing Countries:
- **India** (Code: IN) - Active

### Existing Sub-Companies:
- **WOWL edtech** (Code: WOWL-IN) - India - Active

### All Employees:
All 24 employees are currently assigned to:
- Country: India
- Sub-Company: WOWL edtech

## Features

✅ **Search**: Search countries and sub-companies by name
✅ **Status Management**: Toggle active/inactive status
✅ **Validation**: Prevents deletion if dependencies exist
✅ **Real-time Updates**: Instant table refresh after changes
✅ **Dark Mode Support**: Works with light/dark theme
✅ **Responsive Design**: Mobile-friendly interface

## Employee Login Requirements

When employees log in, they must select:
1. **Country**: From the dropdown (shows only active countries)
2. **Sub-Company**: From the dropdown (shows only active sub-companies for selected country)

The system validates that the selected country and sub-company match the employee's assigned values.

**SuperAdmin Privilege**: SuperAdmin can log in without selecting country/sub-company (optional fields).
