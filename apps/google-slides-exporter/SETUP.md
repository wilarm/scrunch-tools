# Setup Guide for Google Slides Generator

## Setting Up the Default Template

### Step 1: Create Your Default Template

1. **Create a new Google Slides presentation** or use an existing one
2. **Design your template** with your branding and desired layout
3. **Add placeholder variables** wherever you want data to be inserted

### Step 2: Available Placeholder Variables

Add these placeholders anywhere in your slides (titles, body text, etc.):

| Placeholder | Description | Example Output |
|-------------|-------------|----------------|
| `{{brand_name}}` | Brand identifier | "Acme Corp" |
| `{{brand_id}}` | Brand ID | "acme-corp-123" |
| `{{date_range}}` | Full date range | "2024-01-01 to 2024-01-31" |
| `{{start_date}}` | Start date only | "2024-01-01" |
| `{{end_date}}` | End date only | "2024-01-31" |
| `{{total_responses}}` | Response count | "1,234" |
| `{{presence_pct}}` | Brand presence percentage | "45.2%" |
| `{{position_score}}` | Brand position score | "3.45" |
| `{{sentiment_score}}` | Brand sentiment score | "0.82" |
| `{{competitor_presence_pct}}` | Competitor presence % | "32.1%" |
| `{{competitor_position_score}}` | Competitor position score | "4.12" |
| `{{competitor_sentiment_score}}` | Competitor sentiment score | "0.65" |

### Step 3: Example Template Slide

Here's an example of what a slide might look like:

```
Title: {{brand_name}} Performance Report

Body:
During {{date_range}}, {{brand_name}} appeared in {{presence_pct}} of
all responses, with an average position score of {{position_score}}.

Total Responses Analyzed: {{total_responses}}
Brand Sentiment: {{sentiment_score}}
```

After generation, this becomes:

```
Title: Acme Corp Performance Report

Body:
During 2024-01-01 to 2024-01-31, Acme Corp appeared in 45.2% of
all responses, with an average position score of 3.45.

Total Responses Analyzed: 1,234
Brand Sentiment: 0.82
```

### Step 4: Share the Template

1. Click the **Share** button in your Google Slides
2. Change access to **"Anyone with the link"**
3. Set permission to **Viewer** (not Editor)
4. Click **Copy link**

### Step 5: Configure the App

1. Open the template URL and extract the ID from the URL:
   ```
   https://docs.google.com/presentation/d/YOUR_TEMPLATE_ID_HERE/edit
                                          ^^^^^^^^^^^^^^^^^^^^
   ```

2. Open `src/utils/constants.ts` and update the `DEFAULT_TEMPLATE_ID`:
   ```typescript
   export const DEFAULT_TEMPLATE_ID = 'YOUR_TEMPLATE_ID_HERE';
   ```

3. Rebuild the app:
   ```bash
   npm run build
   ```

### Step 6: Test the Template

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Visit the app and enter test data
3. Click "Generate Slides" without switching to custom template
4. Verify that all placeholders are replaced correctly

## Tips for Creating Great Templates

### Design Best Practices

1. **Use placeholder variables in text boxes** - Works in titles, body text, and bullet points
2. **Include your branding** - Logo, colors, fonts
3. **Create multiple slide layouts** - Cover, data slides, conclusion
4. **Add charts/graphs** - You can manually create these and update data later
5. **Use consistent formatting** - Bold the placeholders if you want the replaced text to be bold

### Placeholder Tips

- Placeholders are **case-sensitive** - use exact formatting
- Placeholders work in **any text element** - titles, subtitles, body text, shapes
- Placeholders are replaced **globally** - same variable can be used multiple times
- Use **descriptive text** around placeholders for context
- **Test with sample data** first to verify formatting

### Common Patterns

**Executive Summary Slide:**
```
{{brand_name}} Brand Performance
{{date_range}}

Key Metrics:
• Brand Presence: {{presence_pct}}
• Average Position: {{position_score}}
• Sentiment Score: {{sentiment_score}}
```

**Data Comparison Slide:**
```
Brand vs. Competitors

{{brand_name}}: {{presence_pct}} presence
Competitors: {{competitor_presence_pct}} presence

Sentiment Comparison:
Your Brand: {{sentiment_score}}
Competitors: {{competitor_sentiment_score}}
```

## Troubleshooting

### Placeholders Not Being Replaced

1. **Check exact spelling** - Must match exactly (case-sensitive)
2. **Check curly braces** - Must be double `{{` and `}}`
3. **Check template permissions** - Must be "Anyone with the link"
4. **Verify template ID** - Make sure it's correct in `constants.ts`

### Template Not Found Error

1. **Check sharing settings** - Must be publicly accessible
2. **Check template ID** - Extract from URL correctly
3. **Test template access** - Open in incognito mode to verify

### Data Not Showing Correctly

1. **Check metric selection** - Only selected metrics will have data
2. **Check date range** - Must have data for selected dates
3. **Check API key** - Must be valid and have access to brand

## Advanced: Multiple Templates

If you want to offer multiple template options:

1. Create additional templates following the same steps
2. Update the UI to allow template selection
3. Store multiple template IDs in `constants.ts`:
   ```typescript
   export const TEMPLATES = {
     default: 'TEMPLATE_ID_1',
     executive: 'TEMPLATE_ID_2',
     detailed: 'TEMPLATE_ID_3',
   };
   ```

4. Modify the App.tsx to show a dropdown for template selection
