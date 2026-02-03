# Testing on Localhost

## The Issue

When testing on localhost, you're encountering CORS/COOP (Cross-Origin-Opener-Policy) errors with Google OAuth:
```
Cross-Origin-Opener-Policy policy would block the window.closed call.
```

And the edge function returns 401 because the OAuth flow isn't completing properly on localhost.

## Quick Solution: Test on Production Domain

The easiest way to test is to deploy everything and test on your production domain where OAuth is already configured:

```bash
# 1. Deploy edge function
supabase functions deploy slides-generator

# 2. Build and deploy frontend (if needed)
npm run build
# Deploy to your hosting (Vercel, Netlify, etc.)

# 3. Test on production URL
# Navigate to your production domain and test there
```

## Alternative: Configure OAuth for Localhost

If you need to test on localhost, you must add localhost to your Google OAuth configuration:

### Step 1: Add Localhost to OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services > Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
   - `http://localhost:3000` (if using different port)
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173/oauth/callback`
   - `http://localhost:3000/oauth/callback` (if using different port)
6. Click **Save**

### Step 2: Wait for OAuth Changes to Propagate

Google OAuth changes can take 5-15 minutes to propagate. Wait before testing.

### Step 3: Clear Browser Cache

```bash
# Clear cache or use incognito/private mode
# This ensures you get fresh OAuth tokens
```

### Step 4: Test Again

```bash
npm run dev
# Navigate to http://localhost:5173
# Try generating slides
```

## Testing Without Localhost OAuth

If you don't want to modify OAuth settings, you can test in different ways:

### Option 1: Test on Production

Deploy everything and test on your production domain where OAuth already works.

### Option 2: Test Edge Function Directly

Test the edge function with a valid OAuth token from production:

```bash
# 1. Get an OAuth token from production
# - Open production site in browser
# - Open DevTools Console
# - After authenticating, run: localStorage.getItem('google_oauth_token')
# - Copy the token

# 2. Test edge function with curl
curl -X POST https://qnbxemqvfzzgkxchtbhb.supabase.co/functions/v1/slides-generator \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_COPIED_TOKEN_HERE",
    "templateId": "YOUR_TEMPLATE_ID",
    "slideName": "Test Slide",
    "replacements": {
      "{{brand_name}}": "Test Brand",
      "{{date_range}}": "2024-01-01 to 2024-01-31"
    },
    "charts": [
      {
        "title": "Sentiment",
        "sheetName": "Sentiment",
        "data": [
          {"label": "Positive", "value": 96},
          {"label": "Other", "value": 4}
        ]
      }
    ]
  }'
```

### Option 3: Use Production Frontend + Local Edge Function

If you want to test edge function changes locally:

```bash
# 1. Start local edge function
supabase functions serve slides-generator

# 2. Temporarily modify src/utils/slides.ts to point to localhost
# Change line 46:
# From: const edgeFunctionUrl = 'https://qnbxemqvfzzgkxchtbhb.supabase.co/functions/v1/slides-generator';
# To:   const edgeFunctionUrl = 'http://localhost:54321/functions/v1/slides-generator';

# 3. Test on PRODUCTION domain (not localhost)
# Navigate to your production URL
# The frontend OAuth will work, but edge function calls go to localhost

# 4. Remember to revert the URL change before deploying!
```

## Recommended Testing Flow

For the fastest and most reliable testing:

1. **Deploy edge function** to production:
   ```bash
   supabase functions deploy slides-generator
   ```

2. **Test on production domain** where OAuth already works

3. **Check edge function logs** for debugging:
   ```bash
   supabase functions logs slides-generator --tail
   ```

4. **Only configure localhost OAuth** if you need to iterate quickly on frontend changes

## Common Issues

### Issue: 401 Unauthorized from Edge Function

**Cause:** OAuth token is invalid or expired

**Solution:**
- Re-authenticate (clear localStorage and log in again)
- Check that token is being passed correctly
- Verify OAuth scopes include Sheets and Drive

### Issue: CORS Errors on Localhost

**Cause:** Google OAuth doesn't allow localhost by default

**Solution:**
- Add localhost to Google OAuth configuration
- Or test on production domain instead

### Issue: "Failed to load resource: 401"

**Cause:** Edge function received invalid OAuth token

**Solution:**
- Check browser console for the token being sent
- Verify the token works by testing with curl
- Re-authenticate to get fresh token

### Issue: Charts Not Created But No Error

**Cause:** Edge function may have partial failure

**Solution:**
- Check edge function logs: `supabase functions logs slides-generator --tail`
- Look for specific error messages
- Verify Google Sheets API is enabled in Google Cloud Console

## Debugging Tips

### 1. Check What's Being Sent

In browser console (F12):
```javascript
// Before the fetch call in slides.ts, add:
console.log('Sending to edge function:', {
  accessToken: accessToken.substring(0, 20) + '...',
  templateId,
  slideName,
  chartsCount: charts?.length
});
```

### 2. Monitor Edge Function

In terminal:
```bash
supabase functions logs slides-generator --tail
```

Look for:
- "Found chart placeholder at position..."
- "Using placeholder position for..."
- Any error messages

### 3. Test OAuth Token Validity

In browser console:
```javascript
// Get current token
const token = localStorage.getItem('google_oauth_token');

// Test it
fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token)
  .then(r => r.json())
  .then(console.log);

// Should show: { issued_to, audience, scope, expires_in, access_type }
// If error: token is invalid
```

### 4. Verify Google APIs Enabled

Check that these APIs are enabled in Google Cloud Console:
- ✅ Google Slides API
- ✅ Google Sheets API
- ✅ Google Drive API

## Summary

**For Quick Testing:**
- Deploy edge function: `supabase functions deploy slides-generator`
- Test on production domain (not localhost)
- Check edge function logs for errors

**For Localhost Testing:**
- Add localhost to Google OAuth redirect URIs
- Wait 5-15 minutes for changes to propagate
- Clear browser cache and test again

**When In Doubt:**
- Test on production domain - it's faster and more reliable
- Use edge function logs to debug issues
- Check browser console for frontend errors
