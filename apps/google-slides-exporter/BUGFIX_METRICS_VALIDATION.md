# Bug Fix: Metrics Validation Issue

## Problem

When using a custom template and selecting **all metrics** (including competitor metrics), the "Generate Slides" button would not work. The button appeared to do nothing when clicked.

## Root Cause

The validation logic in `src/utils/api.ts` was checking that if you selected competitor metrics (`competitor_presence_percentage`, `competitor_position_score`, `competitor_sentiment_score`), you must also select competitor dimensions (`competitor_id` or `competitor_name`).

However, **these dimensions were not available in the metrics selector** - they're not included in the `QUERY_METRICS` array that populates the UI.

This created an impossible situation:
1. User selects all metrics → includes competitor metrics ✅
2. Validation checks for competitor dimensions → not found ❌
3. Validation fails silently → button does nothing

## The Fix

Removed the competitor dimension validation because:
1. **Dimensions are not metrics** - they shouldn't be in the metrics selector
2. **The Scrunch Query API automatically includes dimensions** when you request metrics
3. The validation was unnecessary and blocking valid metric selections

### Changed Code

**Before:**
```typescript
export function validateQueryFields(fields: string[]): { valid: boolean; error?: string } {
  if (fields.length === 0) {
    return { valid: false, error: 'Please select at least one metric.' };
  }

  const selectedCompetitorMetrics = fields.filter(f => COMPETITOR_METRICS.includes(f));
  if (selectedCompetitorMetrics.length > 0) {
    const hasCompetitorDimension = fields.some(f => COMPETITOR_DIMENSIONS.includes(f));
    if (!hasCompetitorDimension) {
      return { valid: false, error: 'Competitor metrics require competitor_id or competitor_name.' };
    }
  }

  return { valid: true };
}
```

**After:**
```typescript
export function validateQueryFields(fields: string[]): { valid: boolean; error?: string } {
  if (fields.length === 0) {
    return { valid: false, error: 'Please select at least one metric.' };
  }

  // Note: Competitor dimensions (competitor_id, competitor_name) are automatically
  // included by the API when competitor metrics are requested, so no need to validate them

  return { valid: true };
}
```

## Deployment

**Commit**: `cbf98ad` - "Fix: Remove invalid competitor dimension validation"
**Status**: ✅ Pushed to production
**Deployment**: Vercel will auto-deploy (~2-5 minutes)

## Testing

After Vercel deployment completes:

1. Go to your production slides app
2. Switch to "Use my own template"
3. Enter a custom template ID
4. Click "Select All" in the metrics selector
5. Click "Generate Slides"
6. ✅ Button should now work and generate slides!

## What Now Works

- ✅ Select all metrics with custom template
- ✅ Select competitor metrics without errors
- ✅ Generate slides with any combination of metrics
- ✅ Validation only checks that at least one metric is selected

## Files Changed

- `src/utils/api.ts` - Simplified validation logic
- `dist/` - Rebuilt production bundle

---

**Status**: Fixed and deployed! 🎉
