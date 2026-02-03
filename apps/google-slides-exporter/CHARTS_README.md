# Chart Generation in Google Slides Exporter

This document explains how the dynamic chart generation works and how to customize chart positioning and styling.

## Quick Start

To add charts to your slides:

1. **In your Google Slides template**, add text boxes where you want charts:
   - Type `{{sentiment_chart}}` where you want the sentiment chart
   - Type `{{brand_presence_chart}}` where you want the brand presence chart
   - Type `{{position_chart}}` where you want the position chart

2. **Size and position** the text boxes to define chart placement

3. **Generate slides** as usual - charts will automatically appear at those positions!

That's it! The placeholders will be replaced with actual charts. No code changes needed.

## Overview

The Google Slides Exporter now supports automatic creation of donut charts from your Scrunch Query API data. Charts are:
- Created in a linked Google Sheet
- Styled with your brand colors (#97bb3b and #dfded2)
- Embedded as linked objects in your slides
- Automatically updated when the underlying data changes

## How It Works

### Architecture

1. **Data Flow**: Scrunch Query API → Frontend → Edge Function → Google Sheets API + Google Slides API
2. **Chart Creation**:
   - A Google Sheet is created with your data
   - Each chart gets its own tab in the sheet
   - Charts are created in the sheet with specified styling
   - Charts are linked into your slides at specified positions

### Default Charts

By default, the system creates three donut charts from your brand metrics:

1. **Sentiment Chart** - Shows positive sentiment percentage
2. **Brand Presence Chart** - Shows brand mention percentage
3. **Position Chart** - Shows top position percentage

## Chart Styling

All charts use these default settings:
- **Style**: Donut chart with 75% hole
- **Primary Color**: #97bb3b (olive green) - for the main metric value
- **Secondary Color**: #dfded2 (light gray) - for the remainder/other
- **No legend, title, or borders**
- **Distance from center**: 0%

## Customizing Chart Positions

### Method 1: Using Template Placeholders (Recommended)

The easiest way to position charts is using placeholder variables in your template:

1. **Add text boxes to your template** where you want charts to appear
2. **Type the chart placeholder** in each text box:
   - `{{sentiment_chart}}` - for the sentiment chart
   - `{{brand_presence_chart}}` - for the brand presence chart
   - `{{position_chart}}` - for the position chart

3. **Size and position the text boxes** to define where charts will appear
   - The chart will be placed exactly where the text box is
   - The chart will match the text box's size and position

**Example:**
- Create a text box at position (1.5", 2.5") with size 3"x3"
- Type `{{sentiment_chart}}` in it
- When you generate slides, the sentiment chart will appear at that exact position
- The placeholder text will be removed automatically

### Method 2: Hardcode Positions in Config (Advanced)

To customize chart positions in code, modify the `buildChartConfigs` function in `src/utils/api.ts`:

```typescript
export function buildChartConfigs(data: QueryResult): DonutChartConfig[] {
  const charts: DonutChartConfig[] = [];

  // Sentiment Chart - top left
  if (data.brand_sentiment_score != null) {
    const sentimentPct = data.brand_sentiment_score * 100;
    charts.push({
      title: 'Sentiment',
      sheetName: 'Sentiment',
      data: [
        { label: 'Positive', value: sentimentPct },
        { label: 'Other', value: 100 - sentimentPct },
      ],
      position: {
        x: 1.5,      // inches from left
        y: 2,        // inches from top
        width: 3,    // width in inches
        height: 3,   // height in inches
      },
    });
  }

  // Brand Presence Chart - center
  if (data.brand_presence_percentage != null) {
    const presencePct = data.brand_presence_percentage * 100;
    charts.push({
      title: 'Brand Presence',
      sheetName: 'BrandPresence',
      data: [
        { label: 'Present', value: presencePct },
        { label: 'Not Present', value: 100 - presencePct },
      ],
      position: {
        x: 5,        // center horizontally
        y: 2,
        width: 3,
        height: 3,
      },
    });
  }

  // Position Chart - top right
  if (data.brand_position_score != null) {
    const positionPct = data.brand_position_score * 100;
    charts.push({
      title: 'Position',
      sheetName: 'Position',
      data: [
        { label: 'Top Position', value: positionPct },
        { label: 'Other', value: 100 - positionPct },
      ],
      position: {
        x: 8.5,      // right side
        y: 2,
        width: 3,
        height: 3,
      },
    });
  }

  return charts;
}
```

### Positioning Reference

Google Slides standard dimensions:
- **Width**: 10 inches
- **Height**: 7.5 inches
- **Origin**: Top-left corner (0, 0)

Example positions for three charts in a row:
```typescript
// Left chart
position: { x: 1, y: 2, width: 2.5, height: 2.5 }

// Center chart
position: { x: 3.75, y: 2, width: 2.5, height: 2.5 }

// Right chart
position: { x: 6.5, y: 2, width: 2.5, height: 2.5 }
```

## Specifying Which Slide to Use

By default, charts are placed on the first slide of your presentation. To specify a different slide:

1. **Get the slide object ID** from your template:
   - Open your template in Google Slides
   - Use the Slides API Explorer or view the presentation JSON
   - Find the `objectId` of the slide you want

2. **Add the slideObjectId to your chart config**:
   ```typescript
   {
     title: 'Sentiment',
     sheetName: 'Sentiment',
     data: [...],
     slideObjectId: 'slide_id_from_your_template',
     position: { x: 1, y: 2, width: 3, height: 3 },
   }
   ```

## Customizing Chart Colors

To change the chart colors, modify the `createDonutChart` function in `supabase/functions/slides-generator/sheets.ts`:

```typescript
export async function createDonutChart(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  config: DonutChartConfig
): Promise<number> {
  const primaryColor = hexToRgb(config.primaryColor || '#YOUR_PRIMARY_COLOR');
  const secondaryColor = hexToRgb(config.secondaryColor || '#YOUR_SECONDARY_COLOR');

  // ... rest of function
}
```

Or pass custom colors when creating chart configs:

```typescript
charts.push({
  title: 'Sentiment',
  sheetName: 'Sentiment',
  data: [...],
  primaryColor: '#FF5733',    // Custom primary color
  secondaryColor: '#DAF7A6',  // Custom secondary color
});
```

## Template Setup

Your Google Slides template should:
1. Have placeholder text variables (e.g., `{{brand_name}}`, `{{presence_pct}}`)
2. Have chart placeholders in text boxes (e.g., `{{sentiment_chart}}`, `{{brand_presence_chart}}`, `{{position_chart}}`)
3. Be shared with "Anyone with the link" (View access)

The chart generation will:
- Copy your template
- Detect chart placeholder positions and sizes
- Remove chart placeholder text
- Replace all other text placeholders
- Create charts at the positions where placeholders were

### Available Chart Placeholders

Based on your data, these chart placeholders are automatically recognized:

| Placeholder | Description | Data Source |
|------------|-------------|-------------|
| `{{sentiment_chart}}` | Brand sentiment donut chart | `brand_sentiment_score` |
| `{{brand_presence_chart}}` | Brand presence/visibility chart | `brand_presence_percentage` |
| `{{position_chart}}` | Position/ranking chart | `brand_position_score` |

**Important:** The placeholder name is derived from the chart title by:
1. Converting to lowercase
2. Replacing spaces with underscores
3. Adding `_chart` suffix
4. Wrapping in `{{` and `}}`

For example, if a chart has `title: "Brand Presence"`, its placeholder is `{{brand_presence_chart}}`

## Data Sheet Structure

For each chart, a tab is created in the linked spreadsheet with this structure:

| Metric | Value |
|--------|-------|
| Positive | 96 |
| Other | 4 |

The chart automatically references these cells, so updating the sheet data will update the chart in your slides.

## Troubleshooting

### Charts not appearing
- Check that OAuth has Sheets and Drive scopes enabled
- Verify the slide objectId is correct
- Ensure position coordinates are within slide bounds (0-10 inches wide, 0-7.5 inches tall)

### Wrong colors
- Verify hex color format (#RRGGBB)
- Check that colors are passed to the chart config

### Charts overlap
- Adjust x, y, width, and height values to prevent overlap
- Remember positions are in inches from top-left corner

### Data not updating
- Refresh the linked chart in Slides (Data → Refresh)
- Check that the spreadsheet data was properly populated

## Example: Three Charts Layout

### Option A: Using Template Placeholders (Easiest)

1. Open your Google Slides template
2. Create three text boxes across the slide:
   - **Left box** (1.5", 2.5", size 2.5"x2.5"): Type `{{sentiment_chart}}`
   - **Center box** (4.25", 2.5", size 2.5"x2.5"): Type `{{brand_presence_chart}}`
   - **Right box** (7", 2.5", size 2.5"x2.5"): Type `{{position_chart}}`

3. Save your template - that's it! The charts will appear exactly where you placed the text boxes.

### Option B: Hardcoded Positions (Advanced)

If you prefer to specify positions in code instead of using placeholders:

```typescript
// In src/utils/api.ts
export function buildChartConfigs(data: QueryResult): DonutChartConfig[] {
  const charts: DonutChartConfig[] = [];

  // Chart 1: Sentiment (Left)
  if (data.brand_sentiment_score != null) {
    charts.push({
      title: 'Sentiment',
      sheetName: 'Sentiment',
      data: [
        { label: 'Positive sentiment', value: data.brand_sentiment_score * 100 },
        { label: '', value: (1 - data.brand_sentiment_score) * 100 },
      ],
      position: { x: 1.5, y: 2.5, width: 2.5, height: 2.5 },
    });
  }

  // Chart 2: Brand Presence (Center)
  if (data.brand_presence_percentage != null) {
    charts.push({
      title: 'Brand Presence',
      sheetName: 'BrandPresence',
      data: [
        { label: 'Monitored non-branded prompts mention brand', value: data.brand_presence_percentage * 100 },
        { label: '', value: (1 - data.brand_presence_percentage) * 100 },
      ],
      position: { x: 4.25, y: 2.5, width: 2.5, height: 2.5 },
    });
  }

  // Chart 3: Position (Right)
  if (data.brand_position_score != null) {
    charts.push({
      title: 'Position',
      sheetName: 'Position',
      data: [
        { label: 'Of responses citing an brand-owned URL', value: data.brand_position_score * 100 },
        { label: '', value: (1 - data.brand_position_score) * 100 },
      ],
      position: { x: 7, y: 2.5, width: 2.5, height: 2.5 },
    });
  }

  return charts;
}
```

**Note:** If both a template placeholder AND a hardcoded position exist, the template placeholder takes priority.

## API Reference

### DonutChartConfig Interface

```typescript
interface DonutChartConfig {
  title: string;              // Chart title (for internal reference)
  sheetName: string;          // Name of the sheet tab
  data: ChartData[];          // Array of { label, value } pairs
  slideObjectId?: string;     // Optional: which slide to place on
  position?: {
    x: number;                // Position from left (inches)
    y: number;                // Position from top (inches)
    width: number;            // Chart width (inches)
    height: number;           // Chart height (inches)
  };
  primaryColor?: string;      // Optional: hex color for primary data
  secondaryColor?: string;    // Optional: hex color for secondary data
}
```

## Next Steps

To enable chart generation:
1. Make sure your template has space for charts
2. Customize chart positions if needed (in `src/utils/api.ts`)
3. Deploy the updated edge function: `supabase functions deploy slides-generator`
4. Generate slides as usual - charts will be created automatically!
