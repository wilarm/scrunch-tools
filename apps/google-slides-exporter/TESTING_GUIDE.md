# Testing Guide for Chart Generation

This guide walks through testing the new chart generation feature locally and in production.

## Prerequisites

Before testing, make sure you have:
- ✅ Supabase CLI installed (`supabase --version`)
- ✅ Node.js and npm installed
- ✅ Google OAuth credentials configured
- ✅ Scrunch API key
- ✅ A test Google Slides template with chart placeholders

## Local Development Setup

### 1. Start the Frontend

```bash
# In the project root
npm run dev
```

The frontend should start at `http://localhost:5173`

### 2. Deploy the Edge Function (Test with Production)

Since the edge function uses external APIs (Google Sheets, Google Slides), the easiest way to test is to deploy to Supabase:

```bash
# Deploy the updated edge function
supabase functions deploy slides-generator
```

The function will be available at:
`https://qnbxemqvfzzgkxchtbhb.supabase.co/functions/v1/slides-generator`

### 3. Testing Locally (Alternative - Using Local Edge Function)

If you want to test the edge function locally:

```bash
# Start Supabase local development
supabase start

# Serve the edge function locally
supabase functions serve slides-generator
```

Then update `src/utils/slides.ts` temporarily to point to localhost:

```typescript
// Change this line:
const edgeFunctionUrl = 'https://qnbxemqvfzzgkxchtbhb.supabase.co/functions/v1/slides-generator';

// To:
const edgeFunctionUrl = 'http://localhost:54321/functions/v1/slides-generator';
```

## Creating a Test Template

### Step 1: Create Template in Google Slides

1. Open Google Slides and create a new presentation
2. Add a title slide with some text placeholders:
   - `{{brand_name}}`
   - `{{date_range}}`
   - `{{presence_pct}}`

### Step 2: Add Chart Placeholders

Create three text boxes on your slide:

#### Left Chart (Sentiment)
- Position: ~1.5 inches from left, 2.5 inches from top
- Size: 3 inches x 3 inches
- Text: `{{sentiment_chart}}`

#### Center Chart (Brand Presence)
- Position: ~4.25 inches from left, 2.5 inches from top
- Size: 3 inches x 3 inches
- Text: `{{brand_presence_chart}}`

#### Right Chart (Position)
- Position: ~7 inches from left, 2.5 inches from top
- Size: 3 inches x 3 inches
- Text: `{{position_chart}}`

### Step 3: Share Template

1. Click **Share** in the top-right
2. Change to "Anyone with the link" (View access)
3. Copy the template URL

Example URL:
```
https://docs.google.com/presentation/d/1abc123xyz/edit
```

## Test Scenarios

### Test 1: Basic Chart Generation (Without Placeholders)

**Setup:**
- Use a template WITHOUT chart placeholders
- Charts should appear at default positions (center of slide, 3x3 inches)

**Steps:**
1. Open the app at http://localhost:5173
2. Enter your Scrunch API key
3. Select a brand
4. Choose a date range
5. Enter template ID (without chart placeholders)
6. Enter slide name
7. Click "Generate Slides"

**Expected Result:**
- Slides are generated successfully
- Three charts appear at default positions (may overlap)
- All text placeholders are replaced
- A data spreadsheet is created and logged to console

### Test 2: Chart Generation with Placeholders

**Setup:**
- Use the template created above WITH chart placeholders

**Steps:**
1. Follow the same steps as Test 1
2. Use the template URL with chart placeholders

**Expected Result:**
- Slides are generated successfully
- Three charts appear at the EXACT positions of the placeholders
- Charts match the SIZE of the text boxes
- Placeholder text (`{{sentiment_chart}}`, etc.) is removed
- All other text placeholders are replaced
- A data spreadsheet is created

**Validation:**
- Open the generated slide deck
- Charts should be positioned exactly where the text boxes were
- Charts should be the same size as the text boxes
- Data should match your query results

### Test 3: Mixed Configuration (Placeholder + Hardcoded)

**Setup:**
- Template with only ONE placeholder (e.g., `{{sentiment_chart}}`)
- Other charts should use hardcoded positions

**Steps:**
1. Remove two of the chart placeholders from template
2. Generate slides

**Expected Result:**
- Sentiment chart uses placeholder position
- Other charts use fallback/default positions
- Console logs show which positions are used

### Test 4: Chart Data Accuracy

**Steps:**
1. Generate slides with known data
2. Open the linked data spreadsheet
3. Verify chart data matches API response

**Validation:**
- Check sentiment chart shows correct percentage
- Check brand presence shows correct percentage
- Check position shows correct percentage
- Verify "Other" values sum to 100%

### Test 5: Edge Cases

#### No Chart Data
- Brand with no sentiment data
- Should generate only charts with available data
- Should not crash

#### Invalid Placeholder Names
- Use `{{invalid_chart}}` in template
- Should be treated as regular text placeholder
- Should be replaced with empty string or ignored

#### Overlapping Placeholders
- Create overlapping text boxes with placeholders
- Charts should still be created (may overlap visually)

## Debugging

### Check Edge Function Logs

```bash
# View edge function logs
supabase functions logs slides-generator --tail
```

Look for:
- `Found chart placeholder {{...}} at position: { x, y, width, height }`
- `Using placeholder position for [Chart Name]`
- `Using fallback position for [Chart Name]`

### Check Browser Console

Open Developer Tools → Console to see:
- Chart data spreadsheet URL
- Any JavaScript errors
- Network requests to edge function

### Common Issues

#### Charts Not Appearing
**Possible causes:**
- OAuth scopes don't include Sheets or Drive
- Edge function error (check logs)
- Chart placeholder names don't match (case-sensitive)

**Solution:**
- Check edge function logs
- Verify placeholder names exactly match pattern
- Re-authenticate to get correct OAuth scopes

#### Charts in Wrong Position
**Possible causes:**
- Text box transform/size not read correctly
- EMU to inches conversion issue

**Solution:**
- Check console logs for detected positions
- Verify text box is a standard text box (not a shape with text)

#### Placeholder Text Not Removed
**Possible causes:**
- Placeholder name mismatch
- replaceTextInSlides failed

**Solution:**
- Verify exact placeholder text (including `{{` and `}}`)
- Check edge function logs for errors

#### Charts Showing Wrong Data
**Possible causes:**
- Data calculation error in `buildChartConfigs`
- Chart data structure mismatch

**Solution:**
- Console log the `charts` array before sending
- Verify data matches API response
- Check spreadsheet tabs for actual data

## Manual Testing Checklist

- [ ] Frontend starts without errors
- [ ] Can authenticate with Google
- [ ] Can select template
- [ ] Template validation shows correct placeholders
- [ ] Slides generate successfully
- [ ] Text placeholders are replaced
- [ ] Chart placeholders are detected (check logs)
- [ ] Chart placeholders are removed from slides
- [ ] Charts appear at correct positions
- [ ] Charts match specified sizes
- [ ] Chart data is accurate
- [ ] Data spreadsheet is created
- [ ] Charts link to spreadsheet correctly
- [ ] Can open and view generated presentation
- [ ] No console errors

## Performance Testing

### Metrics to Track

1. **Generation Time**
   - Time from "Generate Slides" click to completion
   - Should be under 15 seconds for 3 charts

2. **Chart Creation**
   - Time to create Google Sheet: ~1-2 seconds
   - Time per chart: ~2-3 seconds
   - Total chart time: ~6-9 seconds

3. **Memory Usage**
   - Monitor browser memory during generation
   - Should not exceed reasonable limits

## Production Testing

Once deployed to production:

1. Test with real user accounts
2. Test with various template sizes/layouts
3. Test with large datasets
4. Monitor error rates in Supabase dashboard
5. Check edge function performance metrics

## Rollback Plan

If issues occur in production:

1. **Quick Fix**: Disable charts by modifying `buildChartConfigs` to return empty array:
   ```typescript
   export function buildChartConfigs(data: QueryResult): DonutChartConfig[] {
     return []; // Temporarily disable charts
   }
   ```

2. **Full Rollback**: Revert edge function to previous version:
   ```bash
   # Get previous version
   supabase functions list --project-ref qnbxemqvfzzgkxchtbhb

   # Deploy previous version
   supabase functions deploy slides-generator --version <previous-version>
   ```

## Success Criteria

The feature is ready for production when:

- ✅ All test scenarios pass
- ✅ No console errors
- ✅ Charts appear at correct positions
- ✅ Data accuracy is 100%
- ✅ Performance is acceptable (<15 seconds)
- ✅ Edge function logs show no errors
- ✅ Works with both placeholder and non-placeholder templates
- ✅ Gracefully handles missing data
- ✅ Documentation is clear and complete
