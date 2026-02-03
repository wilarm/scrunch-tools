# Using Pre-Styled Google Sheets Templates for Charts

## Overview

Instead of creating charts via the API (which has color and transparency limitations), you can create a **Google Sheets template** with pre-styled charts, then have the system copy that template and update the data. This gives you **full control** over chart styling!

## Benefits of Template Approach

✅ **Custom colors** - Use any colors you want, including brand colors
✅ **Transparent backgrounds** - Charts can have transparent backgrounds
✅ **Full styling control** - Fonts, borders, shadows, everything!
✅ **One-time setup** - Style the charts once, reuse forever
✅ **No API limitations** - Bypass all Google Sheets API restrictions

## How It Works

1. **You create** a Google Sheets template with pre-styled charts
2. **System copies** the template for each slide generation
3. **System updates** the data in each sheet with real API values
4. **System links** the existing (already styled) charts to slides

The charts maintain all your custom styling because they're not created via API - they're just copied from your template!

## Step-by-Step Setup

### Step 1: Create the Sheets Template

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it: "Scrunch Chart Template"

### Step 2: Create Three Sheets (Tabs)

Create three sheets with these **exact names**:
- `Sentiment`
- `BrandPresence`
- `Position`

**Important**: The sheet names must match exactly (case-sensitive) because the system looks for these names when updating data.

### Step 3: Add Data Structure to Each Sheet

For **each of the three sheets**, add this data structure:

| Metric | Value |
|--------|-------|
| Label1 | 50    |
| Label2 | 50    |

**Example for Sentiment sheet:**
- Cell A1: `Metric`
- Cell B1: `Value`
- Cell A2: `Positive`
- Cell B2: `75`
- Cell A3: `Other`
- Cell B3: `25`

**Repeat for BrandPresence and Position sheets** (values don't matter, they'll be overwritten)

### Step 4: Create Charts in Each Sheet

For each sheet:

1. **Select the data** (A1:B3)
2. **Insert → Chart**
3. **Chart type**: Pie chart → Donut chart
4. **Customize the chart**:
   - **Chart style**:
     - Background: Transparent (or any color)
     - Border: None
   - **Pie chart** tab:
     - Donut hole: 75%
     - Slice colors: Set your brand colors (#97bb3b for first slice, #dfded2 for second)
   - **Legend**: None (uncheck "Show legend")
   - **Title**: None (clear the title field)

5. **Position** the chart somewhere visible in the sheet (it doesn't matter where)

### Step 5: Repeat for All Three Sheets

Make sure you have:
- ✅ Three sheets: `Sentiment`, `BrandPresence`, `Position`
- ✅ Each sheet has data in A1:B3
- ✅ Each sheet has a styled donut chart
- ✅ All charts have your desired colors and styling

### Step 6: Share the Template

1. Click **Share** button (top right)
2. Under "General access", select **"Anyone with the link"**
3. Set permission to **"Viewer"**
4. Click **"Copy link"**

### Step 7: Get the Template ID

From the URL:
```
https://docs.google.com/spreadsheets/d/TEMPLATE_ID_HERE/edit
```

Copy the `TEMPLATE_ID_HERE` part. This is your **sheetsTemplateId**.

Example:
```
https://docs.google.com/spreadsheets/d/1AbC123XyZ456_example/edit
```
Template ID: `1AbC123XyZ456_example`

## Using the Template in Code

### Option 1: Add to Constants (Recommended)

Add the sheets template ID as a constant:

**File**: `src/utils/constants.ts`

```typescript
export const DEFAULT_TEMPLATE_ID = '1_XI8KsN4NPiaKBEGsnU0Gcbk1Wf9WSNsGj9_rkVV3LY';

// NEW: Add sheets template ID
export const DEFAULT_SHEETS_TEMPLATE_ID = 'YOUR_SHEETS_TEMPLATE_ID_HERE';
```

### Option 2: Pass Directly When Generating

In `App.tsx`, when calling `generateSlides()`:

```typescript
const result = await generateSlides({
  accessToken,
  templateId,
  slideName,
  replacements,
  charts: charts.length > 0 ? charts : undefined,
  sheetsTemplateId: 'YOUR_SHEETS_TEMPLATE_ID_HERE', // Add this!
});
```

## Testing the Template

1. **Generate slides** with chart placeholders
2. **Check results**:
   - ✅ Charts should appear at placeholder positions
   - ✅ Charts should have your custom colors
   - ✅ Charts should have transparent backgrounds (if you set that)
   - ✅ Charts should display correct data
   - ✅ Spreadsheet should be linked for updates

3. **Open the linked spreadsheet**:
   - Should be a copy of your template
   - Data should be updated with real API values
   - Charts should reflect the new data

## Updating Chart Styling

To change how charts look:

1. **Open your sheets template**
2. **Edit any chart** (double-click it)
3. **Change colors, fonts, sizes, etc.**
4. **Save** the template
5. **Next time** you generate slides, new charts will have the updated styling!

No code changes needed - just update the template!

## Troubleshooting

### Charts Don't Appear
- **Check sheet names**: Must be exactly `Sentiment`, `BrandPresence`, `Position`
- **Check template sharing**: Must be "Anyone with the link"
- **Check template ID**: Make sure you copied the correct ID

### Charts Have Wrong Data
- **Check data structure**: Must be in A1:B3 format
- **Check header row**: Row 1 should be `Metric` and `Value`

### Charts Lost Custom Styling
- **Check template**: Make sure the original template still has the styling
- **Re-copy from template**: The system creates a fresh copy each time

## Example: Complete Template Structure

```
Sheet 1: "Sentiment"
┌─────────┬───────┐
│ Metric  │ Value │
├─────────┼───────┤
│ Positive│  75   │
│ Other   │  25   │
└─────────┴───────┘
[Donut Chart with custom colors]

Sheet 2: "BrandPresence"
┌─────────┬───────┐
│ Metric  │ Value │
├─────────┼───────┤
│ Present │  45   │
│ Other   │  55   │
└─────────┴───────┘
[Donut Chart with custom colors]

Sheet 3: "Position"
┌─────────┬───────┐
│ Metric  │ Value │
├─────────┼───────┤
│ Top Pos │  82   │
│ Other   │  18   │
└─────────┴───────┘
[Donut Chart with custom colors]
```

## Advantages Over API Approach

| Feature | API Approach | Template Approach |
|---------|-------------|-------------------|
| Custom colors | ❌ Not supported | ✅ Full control |
| Transparency | ❌ Not supported | ✅ Supported |
| Fonts | ❌ Default only | ✅ Any font |
| Borders | ❌ No control | ✅ Full control |
| Shadows | ❌ Not available | ✅ Available |
| Setup time | None | One-time setup |
| Flexibility | Limited | Complete |

## Best Practices

1. **Name sheets correctly**: Use exact names `Sentiment`, `BrandPresence`, `Position`
2. **Keep data format**: Always use A1:B3 structure
3. **Version control**: Name your template versions (v1, v2, etc.)
4. **Test changes**: Generate test slides after styling changes
5. **Document colors**: Note your brand colors in the template name or description

## Summary

The template approach gives you **complete control** over chart styling while automating the data updates. It's the best of both worlds:
- ✅ Automated data population
- ✅ Custom styling
- ✅ No API limitations
- ✅ Easy to update

Just create the template once with your desired styling, and every generated slide will have perfectly styled charts!

---

**Next Steps**:
1. Create your sheets template with custom styling
2. Add the template ID to your code
3. Generate slides and enjoy perfectly styled charts! 🎉
