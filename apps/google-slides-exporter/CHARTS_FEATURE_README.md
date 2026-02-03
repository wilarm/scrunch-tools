# Dynamic Chart Generation - Quick Links

This feature adds automatic donut chart generation to your Google Slides reports.

## 🚀 Quick Start

**Want to test it now?** Follow these steps:

1. **Deploy:** `supabase functions deploy slides-generator`
2. **Create template** with these placeholders in text boxes:
   - `{{sentiment_chart}}`
   - `{{brand_presence_chart}}`
   - `{{position_chart}}`
3. **Generate slides** - charts appear automatically!

See **[test-charts.md](./test-charts.md)** for detailed testing steps.

## 📚 Documentation

### For Users
- **[CHARTS_README.md](./CHARTS_README.md)** - Complete user guide
  - How to add charts to your templates
  - Positioning charts
  - Customizing colors
  - Troubleshooting

### For Developers
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical overview
  - Architecture and design decisions
  - Code structure
  - API integrations

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures
  - Test scenarios
  - Debugging tips
  - Performance testing

- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Deployment steps
  - Pre-deployment checklist
  - Deployment procedure
  - Post-deployment verification
  - Rollback plan

### Quick Reference
- **[test-charts.md](./test-charts.md)** - Quick test commands and expected results

## ✨ What's New

### Features
- ✅ Automatic donut chart creation from Scrunch data
- ✅ Template-based positioning using placeholders
- ✅ Three default charts: Sentiment, Brand Presence, Position
- ✅ Styled with your brand colors (#97bb3b, #dfded2)
- ✅ Linked to Google Sheets for data updates
- ✅ Fallback positioning for templates without placeholders

### User Experience
**Before:** Only text data in slides
**After:** Visual charts showing metrics at custom positions

### Developer Experience
**Before:** Manual chart creation required
**After:** Automatic - just add placeholder text to template

## 🎨 Chart Specifications

- **Style:** Donut chart with 75% hole
- **Primary Color:** #97bb3b (olive green)
- **Secondary Color:** #dfded2 (light gray)
- **No legend, title, or borders**

## 📝 How to Add Charts to Your Template

1. Open your Google Slides template
2. Add a text box where you want a chart
3. Type the placeholder (e.g., `{{sentiment_chart}}`)
4. Size and position the text box as desired
5. Repeat for other charts
6. Share template with "Anyone with link"
7. Generate slides - done!

## 🔧 Files Modified

### Backend
- `supabase/functions/slides-generator/sheets.ts` (NEW)
- `supabase/functions/slides-generator/index.ts` (MODIFIED)

### Frontend
- `src/types/index.ts`
- `src/utils/api.ts`
- `src/utils/slides.ts`
- `src/App.tsx`

## 📊 Available Chart Placeholders

| Placeholder | Shows | Data Source |
|------------|-------|-------------|
| `{{sentiment_chart}}` | Brand sentiment percentage | `brand_sentiment_score` |
| `{{brand_presence_chart}}` | Brand visibility percentage | `brand_presence_percentage` |
| `{{position_chart}}` | Top position percentage | `brand_position_score` |

## 🚦 Testing Status

- ✅ Implementation complete
- ✅ Documentation complete
- ⏳ Awaiting deployment test
- ⏳ Awaiting production validation

## 📞 Need Help?

1. **Usage questions:** See [CHARTS_README.md](./CHARTS_README.md)
2. **Testing questions:** See [TESTING_GUIDE.md](./TESTING_GUIDE.md)
3. **Deployment questions:** See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
4. **Technical details:** See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## 🎯 Next Steps

1. ✅ Read the quick start above
2. ⏳ Deploy edge function
3. ⏳ Create test template with placeholders
4. ⏳ Generate test slides
5. ⏳ Verify charts appear correctly
6. ⏳ Deploy to production

## 📦 What's Included

- Complete chart generation system
- Placeholder-based positioning
- Google Sheets integration
- Comprehensive documentation
- Testing procedures
- Deployment checklist
- Rollback plan

---

**Ready to test?** Start with [test-charts.md](./test-charts.md)!
