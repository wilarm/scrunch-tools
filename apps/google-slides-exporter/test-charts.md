# Quick Test Guide

## Step-by-Step Test Process

### 1. Deploy Edge Function

```bash
cd /Users/wilarmstrong/Documents/scrunch-repos/scrunch-tools/apps/google-slides-exporter
supabase functions deploy slides-generator
```

### 2. Create Test Template

**Option A: Use This Test Template**
1. Go to: https://docs.google.com/presentation/create
2. Create a slide with three text boxes containing:
   - Left: `{{sentiment_chart}}`
   - Center: `{{brand_presence_chart}}`
   - Right: `{{position_chart}}`
3. Share → "Anyone with link" → Copy URL

**Option B: Quick Manual Test**
1. Use your existing template
2. Don't add chart placeholders
3. Charts will use default positions (fallback mode)

### 3. Start Frontend

```bash
npm run dev
```

Open: http://localhost:5173

### 4. Generate Test Slides

1. **Enter API Key:** Your Scrunch API key
2. **Select Brand:** Choose any brand from dropdown
3. **Date Range:** Last 30 days (or any range with data)
4. **Template ID:**
   - Use your test template URL
   - Or use default template
5. **Slide Name:** "Chart Test - [Your Name] - [Date]"
6. **Click:** "Generate Slides"

### 5. Verify Results

Open the generated slide deck link and check:

✅ **Text Placeholders Replaced**
- `{{brand_name}}` shows actual brand name
- `{{date_range}}` shows date range
- `{{presence_pct}}` shows percentage

✅ **Chart Placeholders Processed**
- `{{sentiment_chart}}` text is GONE
- `{{brand_presence_chart}}` text is GONE
- `{{position_chart}}` text is GONE

✅ **Charts Appear**
- Three donut charts visible
- Charts at placeholder positions (if placeholders used)
- Charts show correct data

✅ **Chart Styling**
- Donut shape with hole in center
- Green (#97bb3b) for metric value
- Gray (#dfded2) for remainder
- No legend or title on charts

✅ **Data Spreadsheet**
- Check browser console for spreadsheet URL
- Spreadsheet has 3 tabs (Sentiment, BrandPresence, Position)
- Each tab has correct data

### 6. Check Console Logs

**Browser Console (F12):**
```
Chart data spreadsheet: https://docs.google.com/spreadsheets/d/...
```

**Edge Function Logs:**
```bash
supabase functions logs slides-generator --tail
```

Look for:
```
Found chart placeholder {{sentiment_chart}} at position: { x: 1.5, y: 2.5, ... }
Using placeholder position for Sentiment: { x: 1.5, y: 2.5, ... }
```

## Expected Results

### With Chart Placeholders:
- ✅ Charts at exact placeholder positions
- ✅ Charts match placeholder sizes
- ✅ Placeholder text removed

### Without Chart Placeholders:
- ✅ Charts at default center position (3.5", 2")
- ✅ Charts are 3x3 inches
- ✅ May overlap (expected)

### Data Accuracy:
- ✅ Sentiment chart shows brand_sentiment_score as percentage
- ✅ Presence chart shows brand_presence_percentage
- ✅ Position chart shows brand_position_score as percentage
- ✅ All "Other" slices sum to 100%

## Troubleshooting

### Charts Don't Appear
1. Check browser console for errors
2. Check edge function logs: `supabase functions logs slides-generator`
3. Verify OAuth has Sheets & Drive scopes

### Charts in Wrong Position
1. Check console log: "Found chart placeholder at position..."
2. Verify text box is standard text box (not a shape)
3. Check placeholder name exactly matches

### Wrong Data
1. Open data spreadsheet
2. Verify data in tabs matches API response
3. Check chart links to correct spreadsheet

## Quick Commands

```bash
# Deploy
supabase functions deploy slides-generator

# Start frontend
npm run dev

# View logs
supabase functions logs slides-generator --tail

# Type check (optional)
npm run typecheck
```

## Success Criteria

✅ Deployment succeeds without errors
✅ Frontend starts on localhost:5173
✅ Can authenticate with Google
✅ Slides generate successfully
✅ Charts appear (at placeholder or default positions)
✅ Chart data is accurate
✅ No console errors
✅ Edge function logs show placeholder detection

## What to Share

If testing works, share:
1. Screenshot of generated slide with charts
2. Link to generated slide deck
3. Console log output showing spreadsheet URL
4. Any issues encountered

If testing fails, share:
1. Browser console errors
2. Edge function logs
3. Steps to reproduce issue
4. Template ID used for testing
