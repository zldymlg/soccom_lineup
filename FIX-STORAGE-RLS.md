# Fix Storage RLS Policy Error

## Problem

```
Storage upload error: StorageApiError: new row violates row-level security policy
```

This error occurs because the Supabase storage bucket has Row-Level Security (RLS) enabled but no policies are configured to allow authenticated users to upload files.

---

## Solution: Configure Storage Policies in Supabase

### METHOD 1: Using Storage UI (EASIEST - Do This First!)

1. **Go to Storage Section**

   - Open Supabase Dashboard: https://supabase.com/dashboard
   - Select your project
   - Click **Storage** in the left sidebar

2. **Find or Create the PDF Bucket**

   - Look for a bucket named **"PDF"**
   - If it doesn't exist, click **"New bucket"** and create it with name: `PDF`

3. **Configure Bucket Policies**

   - Click on the **"PDF"** bucket
   - Click on **"Policies"** tab at the top
   - You should see a button **"New Policy"** or **"Add Policy"**

4. **Add These 4 Policies:**

   **Policy 1: INSERT (Upload)**

   - Click **"New Policy"** → **"For full customization"**
   - Policy name: `Allow authenticated upload`
   - Allowed operation: Check **INSERT**
   - Target roles: Select **authenticated**
   - Policy definition (WITH CHECK):
     ```sql
     bucket_id = 'PDF'
     ```
   - Click **"Review"** then **"Save policy"**

   **Policy 2: SELECT (Read)**

   - Click **"New Policy"** → **"For full customization"**
   - Policy name: `Allow authenticated read`
   - Allowed operation: Check **SELECT**
   - Target roles: Select **authenticated**
   - Policy definition (USING):
     ```sql
     bucket_id = 'PDF'
     ```
   - Click **"Review"** then **"Save policy"**

   **Policy 3: UPDATE (Modify)**

   - Click **"New Policy"** → **"For full customization"**
   - Policy name: `Allow authenticated update`
   - Allowed operation: Check **UPDATE**
   - Target roles: Select **authenticated**
   - USING expression:
     ```sql
     bucket_id = 'PDF'
     ```
   - WITH CHECK expression:
     ```sql
     bucket_id = 'PDF'
     ```
   - Click **"Review"** then **"Save policy"**

   **Policy 4: DELETE (Remove)**

   - Click **"New Policy"** → **"For full customization"**
   - Policy name: `Allow authenticated delete`
   - Allowed operation: Check **DELETE**
   - Target roles: Select **authenticated**
   - Policy definition (USING):
     ```sql
     bucket_id = 'PDF'
     ```
   - Click **"Review"** then **"Save policy"**

5. **Test the Upload**
   - Go back to your application
   - Try uploading a file
   - It should work now! 🎉

---

### METHOD 2: Using SQL Editor (Alternative)

**Only use this if METHOD 1 doesn't work or you prefer SQL**

1. Click on **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Copy and paste this SQL:

```sql
-- DROP existing policies (if any)
DROP POLICY IF EXISTS "Allow authenticated users to upload to PDF bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read PDF bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update PDF bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete PDF bucket" ON storage.objects;

-- CREATE policies
CREATE POLICY "Allow authenticated users to upload to PDF bucket"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'PDF');

CREATE POLICY "Allow authenticated users to read PDF bucket"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'PDF');

CREATE POLICY "Allow authenticated users to update PDF bucket"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'PDF') WITH CHECK (bucket_id = 'PDF');

CREATE POLICY "Allow authenticated users to delete PDF bucket"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'PDF');
```

4. Click **"Run"** or press `Ctrl+Enter`
5. If you get "must be owner" error, use METHOD 1 instead

---

## Alternative: More Restrictive Policies

If you want users to only access their own folders (recommended for better security), use the alternative policies in the `storage-policies.sql` file (uncomment the section).

This will ensure:

- Users can only upload to folders matching their email
- Users can only read/update/delete their own files
- Better data isolation between users

---

## Troubleshooting

### Issue: Still getting RLS error after applying policies

**Solution:**

1. Check if user is logged in (authenticate first)
2. Verify the bucket name is exactly "PDF" (case-sensitive)
3. Clear browser cache and try again

### Issue: Bucket doesn't exist

**Solution:**

1. Create the bucket in Storage section
2. Make sure it's named exactly "PDF"

### Issue: Policies not showing up

**Solution:**

1. Refresh the Supabase dashboard
2. Try running the SQL script again
3. Check for SQL errors in the output

### Issue: Public URL not working

**Solution:**

1. Go to Storage → PDF bucket → Settings
2. Toggle "Public bucket" to ON
3. Save changes

---

## File Structure After Upload

Files will be organized as:

```
PDF/
├── user1@example.com/
│   ├── Processional.pdf
│   ├── Kyrie.pdf
│   └── Gloria.docx
├── user2@example.com/
│   ├── Processional.pdf
│   └── Communion.pdf
```

Each authenticated user gets their own folder based on their email address.

---

## Questions?

If you continue to have issues, check:

1. User is authenticated (logged in)
2. Bucket exists and is named "PDF"
3. Policies are applied correctly
4. No typos in the SQL scripts
