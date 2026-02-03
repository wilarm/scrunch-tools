# Fixing the 401 Authentication Error

## The Problem

You're getting a 401 error because the OAuth token doesn't include the **Google Sheets API** scope, which is required for chart creation.

## The Fix

I've just added the missing scope to the OAuth configuration:

```typescript
// In src/utils/oauth.ts
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/spreadsheets',  // ← ADDED THIS
];
```

## What You Need To Do

Since the scope has changed, you need to **re-authenticate** to get a new token with Sheets permission:

### Step 1: Clear OAuth State

In your browser:
1. Open **DevTools** (F12)
2. Go to **Application** tab → **Storage** → **Session Storage**
3. Delete all session storage items
4. Go to **Local Storage**
5. Delete any OAuth-related items
6. **Close and reopen** the browser tab (or use incognito mode)

### Step 2: Re-authenticate

1. Refresh the page (Ctrl+R or Cmd+R)
2. Click **Generate Slides** again
3. When the Google OAuth popup appears, you'll see it now requests:
   - ✅ Google Drive access
   - ✅ Google Slides access
   - ✅ **Google Sheets access** (NEW!)
4. Click **Allow**

### Step 3: Test Again

After re-authenticating with the new scope, try generating slides again. The 401 error should be gone!

## Verifying Your Token Has The Right Scopes

In the browser console, you can check your token's scopes:

```javascript
// Get your current access token (it's in memory, not localStorage in this app)
// But you can check the OAuth popup URL to see what scopes are being requested

// Or test if the token works with Sheets API:
fetch('https://sheets.googleapis.com/v4/spreadsheets', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    properties: { title: 'Test' }
  })
})
.then(r => r.json())
.then(console.log)
// If you get an error about permissions → token doesn't have Sheets scope
// If you get a response with spreadsheetId → token is valid!
```

## Why This Happened

The original OAuth configuration only requested Drive and Presentations scopes because the feature initially only created slides. Now that we're adding charts (which require creating Google Sheets), we need the Sheets API scope too.

## Additional Improvements Made

I also improved error handling in `src/utils/slides.ts`:
- Better error messages for 401 errors
- Logs the full error response to console
- Tells you specifically to re-authenticate if you get 401

## Summary

**Quick Fix:**
1. Clear browser storage (session + local)
2. Close and reopen the tab
3. Re-authenticate when you try to generate slides
4. Accept the new Sheets permission
5. Test again - should work now!

The scope change has been made in the code, so once you re-authenticate, everything should work perfectly.
