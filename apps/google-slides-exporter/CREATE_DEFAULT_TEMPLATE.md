# Creating the Default Scrunch Template

## Current Issue

The default template ID `1_XI8KsN4NPiaKBEGsnU0Gcbk1Wf9WSNsGj9_rkVV3LY` returns a 404 error, meaning it's either:
- Not accessible (needs to be shared "Anyone with the link")
- Doesn't exist
- You don't have permission to access it

## Solution: Create a New Default Template

### Step 1: Create the Template

1. Go to [Google Slides](https://slides.google.com)
2. Click "Blank" to create a new presentation
3. Name it: "Scrunch Brand Report Template"

### Step 2: Add Slides with Placeholders

Here's a recommended structure:

#### Slide 1: Title Slide
```
{{brand_name}} Brand Report
{{date_range}}
```

#### Slide 2: Overview
```
Brand Performance Overview

Brand: {{brand_name}} (ID: {{brand_id}})
Period: {{date_range}}
Total Responses: {{total_responses}}
```

#### Slide 3: Brand Metrics
```
Brand Metrics

Presence: {{presence_pct}}
Position Score: {{position_score}}
Sentiment Score: {{sentiment_score}}
```

#### Slide 4: Charts (NEW!)
```
Performance Charts

Sentiment:
{{sentiment_chart}}

Brand Presence:
{{presence_chart}}

Position:
{{position_chart}}
```

#### Slide 5: Competitor Comparison (Optional)
```
Competitor Analysis

Competitor Presence: {{competitor_presence_pct}}
Competitor Position: {{competitor_position_score}}
Competitor Sentiment: {{competitor_sentiment_score}}
```

### Step 3: Design the Template

- Add your Scrunch branding (logo, colors)
- Use consistent fonts and styling
- Add charts placeholders where you want them to appear
- Leave placeholder variables exactly as shown (with double curly braces)

### Step 4: Share the Template

**CRITICAL: This step is required for the template to work!**

1. Click the "Share" button (top right)
2. Under "General access", click "Restricted"
3. Select "Anyone with the link"
4. Set permission to "Viewer"
5. Click "Done"

### Step 5: Get the Template ID

1. Look at the URL of your template:
   ```
   https://docs.google.com/presentation/d/TEMPLATE_ID_HERE/edit
   ```

2. Copy the `TEMPLATE_ID_HERE` part

   Example URL:
   ```
   https://docs.google.com/presentation/d/1AbC123XyZ456_example-template-id/edit
   ```

   Template ID: `1AbC123XyZ456_example-template-id`

### Step 6: Update the Code

1. Open `src/utils/constants.ts`
2. Replace line 7 with your new template ID:
   ```typescript
   export const DEFAULT_TEMPLATE_ID = 'YOUR_NEW_TEMPLATE_ID_HERE';
   ```

3. Rebuild and deploy:
   ```bash
   npm run build
   git add src/utils/constants.ts dist/
   git commit -m "Update default template ID"
   git push origin main
   ```

## Chart Placeholder Naming

For charts to work, use these exact placeholder names:

- `{{sentiment_chart}}` - For sentiment donut chart
- `{{presence_chart}}` - For brand presence donut chart (use `{{brand_presence_chart}}` as alternative)
- `{{position_chart}}` - For position donut chart

The system will:
1. Find these placeholders in your template
2. Note their position (x, y coordinates)
3. Remove the placeholder text
4. Insert a chart at that exact position

## Chart Styling

Charts will automatically have:
- **Type**: Donut chart (75% hole size)
- **Colors**: Green (#97bb3b) for the metric, gray (#dfded2) for remainder
- **Data**: Auto-populated from Scrunch Query API
- **Update**: Linked to Google Sheets for easy updates

## Testing Your Template

Once you've updated the template ID:

1. Go to your production slides app
2. Make sure "Use default template" is selected
3. Enter API key, brand, and date range
4. Click "Generate Slides"
5. Check that:
   - ✅ Text placeholders are replaced
   - ✅ Charts appear where placeholders were
   - ✅ Charts show correct data
   - ✅ Slides open successfully

## Quick Alternative: Use Custom Template Instead

If you don't want to create a default template right now, you can:

1. Create any template with your preferred layout
2. Share it "Anyone with the link"
3. In the app, click "Use my own template →"
4. Enter your template URL or ID
5. Select the metrics you want
6. Generate slides

This bypasses the default template entirely!

## Template Best Practices

### For Text Placeholders
- Use descriptive placeholder names
- Keep them visible in your design
- Consider using a colored background to highlight them

### For Chart Placeholders
- Leave enough space (recommended: 3x3 inches minimum)
- Center the placeholder text where you want the chart
- Consider using a colored box to show chart boundaries
- Make placeholder text large enough to be visible

### Example Chart Placeholder Design

Instead of just typing `{{sentiment_chart}}`, create a placeholder box:

```
┌─────────────────────┐
│                     │
│  {{sentiment_chart}}│
│                     │
│    Sentiment Score  │
└─────────────────────┘
```

The chart will replace everything in that position, including the border and text.

## Need Help?

If the template still doesn't work:

1. **Check sharing**: Template MUST be "Anyone with the link"
2. **Check ID**: Make sure you copied the full template ID
3. **Check placeholders**: Use exact names with double curly braces
4. **Test in incognito**: Try generating slides in incognito mode
5. **Check logs**: Look at browser console for specific errors

---

**Current Status**: Default template needs to be created and configured
**Next Step**: Create template, share it publicly, and update `DEFAULT_TEMPLATE_ID`
