# Testing Chart Feature on Production

## ✅ Deployment Status

**Code Pushed**: Commit `f12fbab` has been pushed to GitHub main branch
**Edge Function**: Already deployed (version 3) with chart support
**Frontend**: Will be deployed automatically via Vercel from GitHub

## What Was Deployed

### Frontend Changes
- ✅ Chart configuration builder for sentiment, presence, and position metrics
- ✅ Edge function integration with chart support
- ✅ Updated OAuth scopes to include Google Sheets API
- ✅ Better error handling and logging

### Backend Changes (Already Deployed)
- ✅ Google Sheets API integration for chart data
- ✅ Placeholder detection and positioning system
- ✅ Donut chart creation with exact styling specs
- ✅ Chart linking to slides

## Testing Instructions

### 1. Wait for Vercel Deployment

Check your Vercel dashboard or wait for the deployment notification.
Your production URL should be something like: `https://your-domain.vercel.app/slides`

### 2. Prepare Your Template

Make sure your Google Slides template includes chart placeholders:

```
{{sentiment_chart}}
{{presence_chart}}
{{position_chart}}
```

**Important**: Template must be shared "Anyone with the link" → Viewer access

### 3. Test the Feature

1. **Navigate** to your production slides app: `https://your-domain.vercel.app/slides`

2. **Authenticate** (if needed):
   - You'll be asked to grant permissions
   - Make sure to accept all three: Drive, Presentations, and **Sheets** (new!)

3. **Enter Scrunch Query Details**:
   - Brand ID
   - Date range
   - Template ID (or leave default)
   - Slide name

4. **Generate Slides**:
   - Click "Generate Slides"
   - Watch the console for progress logs
   - Should see: "Sending request to edge function with 3 charts"

5. **Verify Results**:
   - Slides should be created ✅
   - Charts should appear at placeholder positions ✅
   - Charts should have correct data ✅
   - A spreadsheet link should be logged in console ✅

### 4. What to Look For

**Success indicators:**
- ✅ Slides created without errors
- ✅ Three donut charts visible (Sentiment, Presence, Position)
- ✅ Charts positioned where placeholders were
- ✅ Chart styling: 75% hole, green (#97bb3b) and gray (#dfded2) colors
- ✅ Console logs show spreadsheet URL

**In the browser console, you should see:**
```
Sending request to edge function with 3 charts
Chart data spreadsheet: https://docs.google.com/spreadsheets/d/...
```

**Expected chart data:**
- **Sentiment**: Shows brand_sentiment_score as percentage
- **Presence**: Shows brand_presence_percentage
- **Position**: Shows brand_position_score as percentage

### 5. Verify Charts Are Linked

1. Open the generated presentation
2. Click on any chart
3. Click "Options" or "Link to data"
4. Should show link to Google Sheets spreadsheet
5. Edit data in spreadsheet
6. Click "Update" in slides → chart should update

## Troubleshooting

### If OAuth Fails
- Clear browser cache/cookies
- Try incognito/private mode
- Make sure you're accepting the Sheets API permission (new scope)

### If Charts Don't Appear
- Check browser console for errors
- Verify template has placeholder variables
- Make sure Scrunch API returned valid data (not null values)
- Check edge function logs: Go to Supabase dashboard → Edge Functions → Logs

### If Template Can't Be Found (404)
- Verify template is shared "Anyone with the link"
- Check template ID is correct
- Try creating a fresh test template

### If Charts Have Wrong Data
- Check Scrunch API response in console
- Verify the date range has data
- Ensure brand_id is valid

## Expected Timeline

- **Vercel deployment**: ~2-5 minutes after push
- **Chart generation**: ~10-15 seconds per request
- **OAuth re-authentication**: Only needed once (for new Sheets scope)

## Next Steps After Testing

Once you verify it works on production:

1. ✅ Confirm all three charts appear correctly
2. ✅ Verify chart styling matches requirements
3. ✅ Test with different date ranges and brands
4. ✅ Verify linked spreadsheet updates charts

If everything works, the feature is complete! 🎉

## Need Help?

Check these docs:
- `CHARTS_README.md` - User guide for chart placeholders
- `TESTING_GUIDE.md` - Comprehensive testing procedures
- `DEBUG_TEMPLATE_ACCESS.md` - Template access troubleshooting
- `FIX_401_ERROR.md` - OAuth scope issues

## Current Production URLs

Based on your vercel.json:
- **Slides App**: `/slides`
- **OAuth Callback**: `/slides/oauth/callback`

Visit your production domain at the `/slides` path to test!
