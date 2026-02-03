# Quick Start: Testing Chart Feature

## 🚀 TL;DR

Your chart feature is **deployed and ready to test on production**!

## Test Now (3 Steps)

### 1. Visit Production
Go to your production slides app: `https://your-domain.vercel.app/slides`

### 2. Re-Authenticate (One-Time)
- Clear browser storage OR use incognito mode
- When OAuth popup appears, accept **Google Sheets** permission (new!)

### 3. Generate Slides
- Enter brand ID, date range
- Use a template with placeholders: `{{sentiment_chart}}`, `{{presence_chart}}`, `{{position_chart}}`
- Click "Generate Slides"
- Wait ~10-15 seconds
- See charts! ✨

## What You Should See

✅ Presentation with 3 donut charts at placeholder positions
✅ Green (#97bb3b) and gray (#dfded2) colors
✅ Sentiment, Presence, Position metrics from Scrunch API
✅ Console log: "Chart data spreadsheet: [URL]"

## Template Setup

Your template needs chart placeholders:

```
Title Slide

{{brand_name}} Performance
Date Range: {{date_range}}

Sentiment: {{sentiment_chart}}
Presence: {{presence_chart}}
Position: {{position_chart}}
```

**Important**: Template must be shared "Anyone with the link" → Viewer

## Troubleshooting

| Problem | Solution |
|---------|----------|
| OAuth error | Re-authenticate to grant Sheets permission |
| No charts | Check template has placeholders |
| 404 template error | Share template "Anyone with the link" |
| Charts have wrong data | Verify Scrunch API returned data |

## Files You Need

- `PRODUCTION_TESTING.md` - Full testing instructions
- `CHARTS_README.md` - User guide for chart placeholders
- `DEBUG_TEMPLATE_ACCESS.md` - Template troubleshooting

## Deployment Info

**Commit**: `f12fbab`
**Edge Function**: Already deployed (v3)
**Frontend**: Deploying now via Vercel (2-5 min)
**Status**: Ready to test! 🎉

---

**Need more details?** → Read `DEPLOYMENT_COMPLETE.md`
