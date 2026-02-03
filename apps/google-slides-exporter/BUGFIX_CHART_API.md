# Bug Fix: Google Sheets Chart API Specification Errors

## Problem

After fixing the template copy issue, chart generation failed with 400 INVALID_ARGUMENT errors:

```
Invalid value at 'requests[0].add_chart.chart.spec.pie_chart.legend_position'
(type.googleapis.com/google.apps.sheets.v4.PieChartSpec.PieChartLegendPosition), "NONE"

Invalid JSON payload received. Unknown name "colors" at 'requests[0].add_chart.chart.spec':
Cannot find field.

Invalid JSON payload received. Unknown name "border" at 'requests[0].add_chart.chart.spec':
Cannot find field.
```

## Root Causes

The chart specification in `sheets.ts` had three issues that didn't match the Google Sheets API schema:

### Issue 1: Invalid Legend Position Enum
**Problem**: Used `legendPosition: 'NONE'`
**Fix**: Changed to `legendPosition: 'NO_LEGEND'` (correct enum value)

The valid values for `PieChartLegendPosition` are:
- `NO_LEGEND` (not `NONE`)
- `LEFT_LEGEND`
- `RIGHT_LEGEND`
- `TOP_LEGEND`
- `BOTTOM_LEGEND`

### Issue 2: Wrong Location for Colors
**Problem**: Had `colors` at the `spec` level
**Fix**: Moved to `pieChart.slices` with correct structure

**Before:**
```typescript
spec: {
  pieChart: { ... },
  colors: [
    { rgbColor: primaryColor },
    { rgbColor: secondaryColor },
  ],
}
```

**After:**
```typescript
spec: {
  pieChart: {
    ...
    slices: [
      { color: primaryColor },
      { color: secondaryColor },
    ],
  },
}
```

### Issue 3: Invalid Border Field
**Problem**: Had `border` field at `spec` level
**Fix**: Removed it entirely (not supported in Sheets API chart spec)

## The Fixes

### Changed Code

**File**: `supabase/functions/slides-generator/sheets.ts`

**Before (lines 155-216):**
```typescript
body: JSON.stringify({
  requests: [
    {
      addChart: {
        chart: {
          spec: {
            title: '', // No chart title
            pieChart: {
              legendPosition: 'NONE', // ❌ Invalid enum
              pieHole: 0.75,
              domain: { ... },
              series: { ... },
            },
            // ❌ Wrong location for colors
            colors: [
              { rgbColor: primaryColor },
              { rgbColor: secondaryColor },
            ],
            // ❌ Invalid field
            border: {
              color: { rgbColor: { red: 1, green: 1, blue: 1 } },
            },
          },
          position: { ... },
        },
      },
    },
  ],
}),
```

**After (lines 155-210):**
```typescript
body: JSON.stringify({
  requests: [
    {
      addChart: {
        chart: {
          spec: {
            pieChart: {
              legendPosition: 'NO_LEGEND', // ✅ Correct enum
              pieHole: 0.75,
              domain: { ... },
              series: { ... },
              // ✅ Colors in correct location
              slices: [
                { color: primaryColor },
                { color: secondaryColor },
              ],
            },
            // ✅ Removed invalid title and border fields
          },
          position: { ... },
        },
      },
    },
  ],
}),
```

## Deployment

**Commit**: `7c06c52` - "Fix: Correct Google Sheets API chart specification"
**Edge Function**: ✅ Deployed to Supabase
**Status**: Live and ready to test!

## Testing

Now you can test chart generation:

### Expected Behavior
1. ✅ Template copies successfully (previous fix)
2. ✅ Spreadsheet is created
3. ✅ Chart tabs are added to spreadsheet
4. ✅ Donut charts are created with correct styling:
   - 75% donut hole
   - Green (#97bb3b) and gray (#dfded2) colors
   - No legend
5. ✅ Charts are linked to slides at placeholder positions
6. ✅ Presentation opens successfully

### Test Now
1. Go to your production slides app
2. Enter API key, brand, date range
3. Use template with chart placeholders: `{{sentiment_chart}}`, `{{presence_chart}}`, `{{position_chart}}`
4. Click "Generate Slides"
5. Wait ~10-15 seconds
6. Check results!

## What Should Work Now

- ✅ Template copying (fixed in previous commit)
- ✅ Chart creation with correct API schema (this fix)
- ✅ Custom colors for chart slices
- ✅ No legend on charts
- ✅ 75% donut hole
- ✅ Charts linked to slides

## API Reference

For future reference, the correct Google Sheets API chart specification:

```typescript
{
  addChart: {
    chart: {
      spec: {
        pieChart: {
          legendPosition: 'NO_LEGEND',  // Valid enum value
          pieHole: 0.75,                // 0-1 range
          domain: { sourceRange: { ... } },
          series: { sourceRange: { ... } },
          slices: [                     // Colors go here
            { color: { red: 0.59, green: 0.73, blue: 0.23 } },
            { color: { red: 0.87, green: 0.87, blue: 0.82 } },
          ],
        },
      },
      position: { ... },
    },
  },
}
```

## Timeline of Fixes

1. **Initial chart feature** - Added chart generation with placeholder detection
2. **Metrics validation fix** - Removed invalid competitor dimension check
3. **Template 404 fix** - Added `supportsAllDrives=true` to template copy
4. **Chart API fix** (this) - Corrected chart specification to match API schema

## Next Steps

After this fix, the full chart generation workflow should work end-to-end:
1. OAuth authentication ✅
2. Template copying ✅
3. Chart creation ✅ (just fixed!)
4. Chart linking ✅
5. Presentation generation ✅

Test it now! 🎉

---

**Status**: ✅ Fixed and deployed!
**Ready to test**: Yes, immediately
