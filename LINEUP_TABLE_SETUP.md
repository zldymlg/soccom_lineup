# LINEUP Table Setup Guide

## Quick Setup (Supabase Console)

### Step 1: Create the LINEUP Table

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** on the left sidebar
3. Click **New Query**
4. Copy and paste the SQL from `SQL_LINEUP_SETUP.sql`
5. Click **Run** button

OR manually create with this simplified script:

```sql
CREATE TABLE IF NOT EXISTS "LINEUP" (
    id BIGSERIAL PRIMARY KEY,
    "NAME" TEXT NOT NULL,
    "EMAIL" TEXT NOT NULL UNIQUE,
    "POSITION" TEXT DEFAULT 'member',
    "PROFILE" TEXT,
    "PHONE" TEXT,
    "DEPARTMENT" TEXT,
    "DATE" DATE,
    "TIME" TIME,
    "SCHEDULED_AT" TIMESTAMP,
    "STATUS" TEXT DEFAULT 'Pending',
    "CREATED_AT" TIMESTAMP DEFAULT NOW(),
    "UPDATED_AT" TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_lineup_email ON "LINEUP"("EMAIL");
CREATE INDEX idx_lineup_position ON "LINEUP"("POSITION");
CREATE INDEX idx_lineup_date ON "LINEUP"("DATE");
CREATE INDEX idx_lineup_status ON "LINEUP"("STATUS");
CREATE INDEX idx_lineup_created_at ON "LINEUP"("CREATED_AT");
```

### Step 2: Create Profile Picture Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **New Bucket**
3. Name: `profiles`
4. Check **Public bucket** ✅
5. Click **Create**

### Step 3: Enable Row Level Security (Optional but Recommended)

```sql
-- Enable RLS on LINEUP table
ALTER TABLE "LINEUP" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read their own profile" ON "LINEUP"
    FOR SELECT
    USING (auth.uid()::text = "EMAIL" OR auth.role() = 'authenticated');

-- Allow admins to manage all records
CREATE POLICY "Admins can manage LINEUP" ON "LINEUP"
    FOR ALL
    USING (auth.role() = 'service_role' OR
           (auth.role() = 'authenticated' AND EXISTS (
               SELECT 1 FROM "LINEUP"
               WHERE "EMAIL" = auth.email()
               AND "POSITION" IN ('soccom', 'admin')
           )));
```

## Table Structure

| Column           | Type      | Description                                          |
| ---------------- | --------- | ---------------------------------------------------- |
| **id**           | BIGSERIAL | Primary key (auto-increment)                         |
| **NAME**         | TEXT      | User's full name                                     |
| **EMAIL**        | TEXT      | User email (UNIQUE)                                  |
| **POSITION**     | TEXT      | Role: member, choir, soccom, admin                   |
| **PROFILE**      | TEXT      | URL to profile picture (stored in 'profiles' bucket) |
| **PHONE**        | TEXT      | User's phone number                                  |
| **DEPARTMENT**   | TEXT      | User's department/group                              |
| **DATE**         | DATE      | Service/event date (YYYY-MM-DD)                      |
| **TIME**         | TIME      | Service/event time (HH:MM:SS)                        |
| **SCHEDULED_AT** | TIMESTAMP | Full date-time of scheduled event                    |
| **STATUS**       | TEXT      | Status: Pending, Approved, Completed                 |
| **CREATED_AT**   | TIMESTAMP | Record creation time (auto)                          |
| **UPDATED_AT**   | TIMESTAMP | Last update time (auto)                              |

## Sample Data Insert

```sql
-- Insert sample users
INSERT INTO "LINEUP" (
    "NAME",
    "EMAIL",
    "POSITION",
    "PROFILE",
    "PHONE",
    "DEPARTMENT",
    "SCHEDULED_AT",
    "STATUS"
) VALUES
(
    'John Doe',
    'john@example.com',
    'soccom',
    'https://your-bucket.supabase.co/storage/v1/object/public/profiles/john.jpg',
    '+1-555-1234',
    'Music Ministry',
    '2024-12-25 10:00:00',
    'Pending'
),
(
    'Jane Smith',
    'jane@example.com',
    'choir',
    'https://your-bucket.supabase.co/storage/v1/object/public/profiles/jane.jpg',
    '+1-555-5678',
    'Choir Group',
    '2024-12-25 09:00:00',
    'Approved'
);
```

## Admin Panel Integration

The Admin panel (`src/Admin.tsx`) now uses the LINEUP table with:

✅ **Create Users** - Add new members with profile pictures
✅ **Edit Users** - Update user info and change profile pictures
✅ **Delete Users** - Remove users from the system
✅ **Profile Pictures** - Uploaded to the `profiles` storage bucket
✅ **Role Management** - Assign positions (member, choir, soccom, admin)

## Accessing Admin Panel

1. Make sure your user has `POSITION = 'soccom'` or `POSITION = 'admin'`
2. Login with that account
3. Click **Admin** in the navbar
4. Or navigate to `/admin`

## Notes

- **Email is UNIQUE** - Each user must have a unique email
- **PROFILE column** - Stores the public URL of the profile picture
- **Positions**:
  - `member` - Regular members (default)
  - `choir` - Choir members (can submit files)
  - `soccom` - Soccom/admin users (can access admin panel)
  - `admin` - System admins
- **Timestamps** - Automatically set on creation and update
- **Indexes** - Created for common search queries (email, position, date, status)

## Troubleshooting

**Error: relation "LINEUP" does not exist**

- Table hasn't been created yet
- Run the SQL setup script above

**Error: permission denied**

- RLS policies might be blocking access
- Check Row Level Security policies in Table Editor

**Profile pictures not showing**

- Ensure `profiles` bucket is created and set to public
- Check that profile URL is correctly stored

**Can't access Admin panel**

- Verify user has `POSITION = 'soccom'` or `POSITION = 'admin'`
- Check that admin panel route is accessible

## File References

- Setup SQL: `SQL_LINEUP_SETUP.sql`
- Admin Component: `src/Admin.tsx`
- Admin Styles: `src/Admin.css`
- Setup Guide: `ADMIN_SETUP.md`
