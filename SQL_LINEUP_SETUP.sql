-- LINEUP Table Creation Script for Supabase
-- This script creates the LINEUP table with all necessary columns for user profiles and management

-- Create LINEUP table
CREATE TABLE IF NOT EXISTS "LINEUP" (
    id BIGSERIAL PRIMARY KEY,
    -- User Info
    "NAME" TEXT NOT NULL,
    "EMAIL" TEXT NOT NULL UNIQUE,
    "POSITION" TEXT DEFAULT 'member',
    "PROFILE" TEXT, -- URL to profile picture
    
    -- User Details
    "PHONE" TEXT,
    "DEPARTMENT" TEXT,
    
    -- Mass Schedule (for choir/soccom members)
    "DATE" DATE,
    "TIME" TIME,
    "SCHEDULED_AT" TIMESTAMP,
    "STATUS" TEXT DEFAULT 'Pending',
    
    -- Timestamps
    "CREATED_AT" TIMESTAMP DEFAULT NOW(),
    "UPDATED_AT" TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for common queries
    CONSTRAINT email_format CHECK ("EMAIL" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lineup_email ON "LINEUP"("EMAIL");
CREATE INDEX IF NOT EXISTS idx_lineup_position ON "LINEUP"("POSITION");
CREATE INDEX IF NOT EXISTS idx_lineup_date ON "LINEUP"("DATE");
CREATE INDEX IF NOT EXISTS idx_lineup_status ON "LINEUP"("STATUS");
CREATE INDEX IF NOT EXISTS idx_lineup_created_at ON "LINEUP"("CREATED_AT");

-- Enable Row Level Security (RLS)
ALTER TABLE "LINEUP" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own profile" ON "LINEUP";
DROP POLICY IF EXISTS "Only admins can insert" ON "LINEUP";
DROP POLICY IF EXISTS "Only admins can update" ON "LINEUP";
DROP POLICY IF EXISTS "Only admins can delete" ON "LINEUP";

-- Create RLS Policies
-- Policy: Allow users to read their own profile
CREATE POLICY "Users can read their own profile" ON "LINEUP"
    FOR SELECT
    USING (auth.uid()::text = "EMAIL" OR auth.role() = 'authenticated');

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Only admins can insert" ON "LINEUP"
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM "LINEUP" 
        WHERE "EMAIL" = auth.email() 
        AND "POSITION" IN ('soccom', 'admin')
    ));

CREATE POLICY "Only admins can update" ON "LINEUP"
    FOR UPDATE
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM "LINEUP" 
        WHERE "EMAIL" = auth.email() 
        AND "POSITION" IN ('soccom', 'admin')
    ));

CREATE POLICY "Only admins can delete" ON "LINEUP"
    FOR DELETE
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM "LINEUP" 
        WHERE "EMAIL" = auth.email() 
        AND "POSITION" IN ('soccom', 'admin')
    ));

-- Optional: Create a function to automatically update UPDATED_AT
CREATE OR REPLACE FUNCTION update_lineup_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."UPDATED_AT" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating UPDATED_AT
DROP TRIGGER IF EXISTS update_lineup_timestamp_trigger ON "LINEUP";
CREATE TRIGGER update_lineup_timestamp_trigger
BEFORE UPDATE ON "LINEUP"
FOR EACH ROW
EXECUTE FUNCTION update_lineup_timestamp();

-- Create storage bucket for profiles if it doesn't exist
-- Note: This must be done through Supabase dashboard or SQL console
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true);

-- ========================================
-- INSERT SAMPLE ACCOUNTS
-- ========================================

-- Admin Account
INSERT INTO "LINEUP" (
    "NAME",
    "EMAIL",
    "POSITION",
    "PHONE",
    "DEPARTMENT",
    "SCHEDULED_AT",
    "STATUS"
) VALUES (
    'Admin User',
    'admin@soccom.local',
    'admin',
    '+1-555-0001',
    'Administration',
    NOW(),
    'Approved'
) ON CONFLICT DO NOTHING;

-- Soccom Account (Organizer)
INSERT INTO "LINEUP" (
    "NAME",
    "EMAIL",
    "POSITION",
    "PHONE",
    "DEPARTMENT",
    "SCHEDULED_AT",
    "STATUS"
) VALUES (
    'Soccom Organizer',
    'soccom@soccom.local',
    'soccom',
    '+1-555-0002',
    'Music Ministry',
    NOW(),
    'Approved'
) ON CONFLICT DO NOTHING;

-- Choir Member Account
INSERT INTO "LINEUP" (
    "NAME",
    "EMAIL",
    "POSITION",
    "PHONE",
    "DEPARTMENT",
    "SCHEDULED_AT",
    "STATUS"
) VALUES (
    'Choir Member',
    'choir@soccom.local',
    'choir',
    '+1-555-0003',
    'Choir Group',
    NOW(),
    'Approved'
) ON CONFLICT DO NOTHING;

COMMIT;
