# Lineup Editing Feature

## Overview

Added functionality to view and edit past lineups with a 24-hour restriction before mass time.

## Features Added

### 1. **View Lineups Button**

- Located in the header next to the user profile
- Opens a modal displaying all lineups created by the logged-in user
- Shows lineups sorted by date (most recent first)

### 2. **Lineups Modal**

The modal displays:

- **Date**: The mass date in a readable format
- **Mass Schedule**: The time of the mass
- **Songs Count**: Number of songs in the lineup
- **Created Date**: When the lineup was originally created
- **Actions**: Edit button (or locked icon if within 24 hours)

### 3. **24-Hour Edit Restriction**

- Users can edit lineups that are **24+ hours** before the mass
- Lineups within 24 hours show a "Locked" button
- Clear visual indication (lock icon) when editing is disabled

### 4. **Edit Functionality**

When editing a lineup:

- All form fields are populated with existing data
- Header changes to show "Editing Lineup" with pencil icon
- Submit button changes to "Update Lineup"
- "Cancel Edit" button appears to clear the form
- Existing files from storage are displayed
- Users can add more files or remove existing ones

### 5. **Update vs Create**

- **Creating New**: Standard "Submit Lineup" button saves a new entry
- **Editing Existing**: "Update Lineup" button updates the existing entry
- Database operations automatically detect edit mode

## Usage Flow

### Viewing Lineups

1. Click "View Lineups" button in the header
2. Browse your past lineups in the modal
3. Click "Edit" on any lineup that's 24+ hours away

### Editing a Lineup

1. Click "Edit" on an eligible lineup
2. Form populates with existing data
3. Make your changes
4. Click "Update Lineup" to save
5. Or click "Cancel Edit" to discard changes

### Restrictions

- Cannot edit lineups less than 24 hours before mass
- Must be logged in to view lineups
- Only your own lineups are displayed

## Technical Details

### New Interfaces

```typescript
interface LineupRecord {
  id: number;
  name: string;
  position: string;
  mass_schedule: string;
  mass_date: string;
  created_at: string;
  // ... all mass parts and their storage fields
}
```

### Key Functions

- `fetchLineups()`: Retrieves lineups from Supabase
- `canEditLineup(massDate)`: Checks if 24+ hours remain
- `loadLineupForEdit(lineup)`: Populates form with lineup data

### State Management

- `showLineups`: Controls modal visibility
- `lineups`: Array of user's lineups
- `editingLineup`: Currently editing lineup (null if creating new)
- `loadingLineups`: Loading state for fetching data

## Database Considerations

- Update operation uses `id` field to identify the record
- All column names are converted to lowercase (Postgres convention)
- File storage URLs are preserved when editing
- New files can be added to existing lineups

## Future Enhancements

- Add delete functionality for lineups
- Add preview/view-only mode for locked lineups
- Add filter/search for lineups by date range
- Add duplicate lineup feature for repeated schedules
