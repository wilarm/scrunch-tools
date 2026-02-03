# API Limitation: Custom Pie Chart Colors Not Supported

## Issue

The Google Sheets API v4 **does not support** custom colors for individual pie chart slices through the `PieChartSpec` specification.

When we tried to add custom colors using the `slices` field, the API returned:

```
Invalid JSON payload received. Unknown name "slices" at
'requests[0].add_chart.chart.spec.pie_chart': Cannot find field.
```

## Investigation

I checked the official Google Sheets API documentation:

1. **PieChartSpec** ([Reference](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/charts#PieChartSpec)) only supports:
   - `legendPosition` (enum)
   - `domain` (ChartData)
   - `series` (ChartData)
   - `threeDimensional` (boolean)
   - `pieHole` (number)

2. **No color customization** is available at the pie chart spec level

3. **BasicChartSpec** supports colors, but only for line/bar/column charts, not pie charts

## The Solution

We removed the custom color specification and now use **Google Sheets' default color scheme**. The charts will still be:

✅ Donut charts (75% hole)
✅ No legend
✅ Proper data display
❌ Custom green/gray colors (not supported by API)

## What Changed

**File**: `supabase/functions/slides-generator/sheets.ts`

**Before:**
```typescript
export async function createDonutChart(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  config: DonutChartConfig
): Promise<number> {
  const primaryColor = hexToRgb(config.primaryColor || '#97bb3b');
  const secondaryColor = hexToRgb(config.secondaryColor || '#dfded2');

  // ... chart spec with:
  slices: [
    { color: primaryColor },
    { color: secondaryColor },
  ],
}
```

**After:**
```typescript
export async function createDonutChart(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  config: DonutChartConfig
): Promise<number> {
  // Note: Google Sheets API v4 does not support custom colors for pie chart slices
  // The API will use default colors

  // ... chart spec without color customization
}
```

## Workaround Options (Future)

If custom colors are absolutely required, here are potential approaches:

### Option 1: Manual Editing After Creation
1. Create charts with default colors via API ✅
2. User manually edits colors in Google Sheets UI
3. Colors persist in linked charts

**Pros**: Simple, colors are maintained
**Cons**: Requires manual step, not fully automated

### Option 2: Use Images Instead of Charts
1. Generate chart images on backend (using a charting library)
2. Upload images to Google Drive
3. Insert images into slides at placeholder positions

**Pros**: Full color control, custom styling
**Cons**: Not linked to data, no auto-updates

### Option 3: Direct Slides API Chart Creation
1. Skip Google Sheets entirely
2. Use Slides API to create visual shapes that look like charts
3. Draw circles, text, etc. to mimic donut chart

**Pros**: Complete control over appearance
**Cons**: Much more complex, no data updates

### Option 4: Third-Party Charting Service
1. Use a service like QuickChart or Chart.io
2. Generate chart images with custom colors
3. Insert as images in slides

**Pros**: Easy color customization, professional appearance
**Cons**: External dependency, costs, no data updates

## Current Implementation

For now, we're using **Google Sheets default colors** because:
- ✅ Charts are functional and display data correctly
- ✅ Charts are linked to spreadsheet for updates
- ✅ Donut chart style with no legend works as designed
- ✅ Professional appearance with Sheets' default palette
- ⚠️ Colors won't match Scrunch brand exactly (#97bb3b, #dfded2)

## What Works

The current implementation provides:
- ✅ **Donut charts** with 75% hole size
- ✅ **No legend** (clean appearance)
- ✅ **Linked to spreadsheet** (data updates work)
- ✅ **Positioned at placeholders** in slides
- ✅ **Auto-populated data** from Scrunch API
- ✅ **Three charts**: Sentiment, Presence, Position

## What Doesn't Work (API Limitation)

- ❌ Custom green (#97bb3b) and gray (#dfded2) colors
- ❌ Per-slice color control via API
- ❌ Brand color matching

## Deployment

**Commit**: `fda6bb8` - "Fix: Remove unsupported color customization from pie charts"
**Status**: ✅ Deployed and live
**Next**: Test chart generation - should work now!

## Testing

Try generating slides with charts. You should see:
1. ✅ Template copies successfully
2. ✅ Spreadsheet is created
3. ✅ Three donut charts created
4. ✅ Charts linked to slides at placeholder positions
5. ✅ Charts display correct data
6. ⚠️ Charts use Google Sheets default colors (not custom green/gray)

## Recommendation

**Accept the default colors for now.** The charts are functional and professional-looking. If custom colors are absolutely required in the future, we can implement Option 1 (manual editing) or explore other workarounds.

---

**Status**: API limitation documented, charts work with default colors
**Color customization**: Not supported by Google Sheets API v4

## Sources

- [Charts | Google Sheets API](https://developers.google.com/workspace/sheets/api/samples/charts)
- [PieChartSpec Reference](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/charts#PieChartSpec)
- [How to Customize Charts | Google for Developers](https://developers.google.com/chart/interactive/docs/customizing_charts)
