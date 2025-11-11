-- ============================================================
-- SUPABASE STORAGE RLS POLICIES FOR "PDF" BUCKET
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to enable file uploads
-- Navigate to: Supabase Dashboard → SQL Editor → New Query
-- IMPORTANT: Make sure you're running this in the SQL Editor, not the Database
-- ============================================================

-- Note: If you get "must be owner of table objects" error, 
-- the policies might already exist or you need to use the Dashboard UI instead

-- 1. DROP existing policies for the PDF bucket (if any)
DROP POLICY IF EXISTS "Allow authenticated users to upload to PDF bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read PDF bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update PDF bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete PDF bucket" ON storage.objects;

-- 2. CREATE POLICY: Allow authenticated users to INSERT (upload) files
CREATE POLICY "Allow authenticated users to upload to PDF bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'PDF');

-- 3. CREATE POLICY: Allow authenticated users to SELECT (read/download) files
CREATE POLICY "Allow authenticated users to read PDF bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'PDF');

-- 4. CREATE POLICY: Allow authenticated users to UPDATE (replace) their own files
CREATE POLICY "Allow authenticated users to update PDF bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'PDF')
WITH CHECK (bucket_id = 'PDF');

-- 5. CREATE POLICY: Allow authenticated users to DELETE their own files
CREATE POLICY "Allow authenticated users to delete PDF bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'PDF');

-- ============================================================
-- ALTERNATIVE: More restrictive policies (users can only access their own folders)
-- ============================================================
-- Uncomment the following if you want users to only access their own folders:

/*
-- DROP existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to upload to PDF bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read PDF bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update PDF bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete PDF bucket" ON storage.objects;

-- Users can only upload to their own folder (folder name matches their email)
CREATE POLICY "Allow users to upload to their own folder in PDF bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'PDF' AND
  (storage.foldername(name))[1] = auth.email()::text
);

-- Users can only read from their own folder
CREATE POLICY "Allow users to read their own folder in PDF bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'PDF' AND
  (storage.foldername(name))[1] = auth.email()::text
);

-- Users can only update files in their own folder
CREATE POLICY "Allow users to update their own folder in PDF bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'PDF' AND
  (storage.foldername(name))[1] = auth.email()::text
)
WITH CHECK (
  bucket_id = 'PDF' AND
  (storage.foldername(name))[1] = auth.email()::text
);

-- Users can only delete files in their own folder
CREATE POLICY "Allow users to delete their own folder in PDF bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'PDF' AND
  (storage.foldername(name))[1] = auth.email()::text
);
*/

-- ============================================================
-- VERIFY POLICIES
-- ============================================================
-- Run this to verify your policies are created:
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================================
-- TROUBLESHOOTING
-- ============================================================
-- If you still have issues, verify:
-- 1. The bucket "PDF" exists: Go to Storage → Check if "PDF" bucket exists
-- 2. Bucket is public or has correct access: Storage → PDF → Settings
-- 3. User is authenticated: Check auth.users table has the user
-- ============================================================
