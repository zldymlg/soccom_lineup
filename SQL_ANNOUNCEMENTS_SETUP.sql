-- Announcements Table for SOCCOM System
-- This table stores announcements that can be displayed in the Choir component

CREATE TABLE IF NOT EXISTS "announcements" (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by TEXT NOT NULL,
    media_urls TEXT, -- JSON array of file/image URLs
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_active ON "announcements"("is_active");
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON "announcements"("created_at");

-- Enable Row Level Security
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can read active announcements" ON "announcements";
DROP POLICY IF EXISTS "Only admins can insert announcements" ON "announcements";
DROP POLICY IF EXISTS "Only admins can update announcements" ON "announcements";
DROP POLICY IF EXISTS "Only admins can delete announcements" ON "announcements";

-- Create RLS Policies
-- Policy: Everyone can read active announcements
CREATE POLICY "Everyone can read active announcements" ON "announcements"
    FOR SELECT
    USING (is_active = TRUE);

-- Policy: Only admins can insert announcements
CREATE POLICY "Only admins can insert announcements" ON "announcements"
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM "LINEUP" 
        WHERE "EMAIL" = auth.email() 
        AND "POSITION" IN ('soccom', 'admin')
    ));

-- Policy: Only admins can update announcements
CREATE POLICY "Only admins can update announcements" ON "announcements"
    FOR UPDATE
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM "LINEUP" 
        WHERE "EMAIL" = auth.email() 
        AND "POSITION" IN ('soccom', 'admin')
    ));

-- Policy: Only admins can delete announcements
CREATE POLICY "Only admins can delete announcements" ON "announcements"
    FOR DELETE
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM "LINEUP" 
        WHERE "EMAIL" = auth.email() 
        AND "POSITION" IN ('soccom', 'admin')
    ));

-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_announcements_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_announcements_timestamp_trigger ON "announcements";
CREATE TRIGGER update_announcements_timestamp_trigger
BEFORE UPDATE ON "announcements"
FOR EACH ROW
EXECUTE FUNCTION update_announcements_timestamp();
