# Deployment Checklist for Chart Feature

## Pre-Deployment

### 1. Code Review
- [x] Edge function implements placeholder detection
- [x] Edge function creates charts at placeholder positions
- [x] Frontend passes chart configurations
- [x] Documentation is complete
- [ ] TypeScript minor warnings addressed (optional, not blocking)

### 2. Files Modified/Created
- [x] `supabase/functions/slides-generator/sheets.ts` (NEW)
- [x] `supabase/functions/slides-generator/index.ts` (MODIFIED)
- [x] `src/types/index.ts` (MODIFIED)
- [x] `src/utils/api.ts` (MODIFIED)
- [x] `src/utils/slides.ts` (MODIFIED)
- [x] `src/App.tsx` (MODIFIED)
- [x] `CHARTS_README.md` (NEW)
- [x] `TESTING_GUIDE.md` (NEW)
- [x] `DEPLOYMENT_CHECKLIST.md` (NEW - this file)

### 3. Testing Template Ready
- [ ] Create test Google Slides template
- [ ] Add text placeholders (`{{brand_name}}`, etc.)
- [ ] Add chart placeholders:
  - [ ] `{{sentiment_chart}}`
  - [ ] `{{brand_presence_chart}}`
  - [ ] `{{position_chart}}`
- [ ] Share template with "Anyone with the link"
- [ ] Note template ID for testing

## Deployment Steps

### Step 1: Deploy Edge Function

```bash
# Navigate to project root
cd /Users/wilarmstrong/Documents/scrunch-repos/scrunch-tools/apps/google-slides-exporter

# Deploy the edge function
supabase functions deploy slides-generator

# Expected output:
# ✓ Deployed function slides-generator
# Function URL: https://qnbxemqvfzzgkxchtbhb.supabase.co/functions/v1/slides-generator
```

**Verification:**
- Check deployment succeeded (no errors)
- Function URL is accessible

### Step 2: Test Edge Function (Optional Local Test)

```bash
# Test with curl
curl -X POST https://qnbxemqvfzzgkxchtbhb.supabase.co/functions/v1/slides-generator/preview \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_GOOGLE_OAUTH_TOKEN",
    "templateId": "YOUR_TEMPLATE_ID"
  }'
```

**Expected Response:**
```json
{
  "placeholders": ["{{brand_name}}", "{{sentiment_chart}}", ...],
  "slideCount": 1
}
```

### Step 3: Deploy Frontend (if needed)

If you have a production frontend deployment:

```bash
# Build frontend
npm run build

# Deploy to your hosting platform (Vercel, Netlify, etc.)
# This depends on your setup
```

### Step 4: Test End-to-End

1. **Open the application** (localhost or production URL)
2. **Enter credentials:**
   - Scrunch API key
   - Select a brand
   - Choose date range
3. **Configure template:**
   - Enter test template ID (with chart placeholders)
   - Enter slide name
4. **Generate slides**
5. **Verify results:**
   - Check slides generated successfully
   - Charts appear at placeholder positions
   - Data is accurate

### Step 5: Monitor

```bash
# Watch edge function logs in real-time
supabase functions logs slides-generator --tail

# Look for:
# - "Found chart placeholder {{...}} at position: ..."
# - "Using placeholder position for [Chart Name]"
# - Any error messages
```

## Post-Deployment Verification

### Functional Tests

- [ ] Can generate slides with text-only placeholders (no charts)
- [ ] Can generate slides with chart placeholders
- [ ] Charts appear at correct positions
- [ ] Charts match placeholder sizes
- [ ] Placeholder text is removed
- [ ] Data spreadsheet is created
- [ ] Charts link to spreadsheet
- [ ] All data is accurate

### Performance Tests

- [ ] Generation completes in <15 seconds
- [ ] No memory leaks in frontend
- [ ] Edge function responds quickly (<10s)
- [ ] No timeout errors

### Error Handling

- [ ] Handles missing chart data gracefully
- [ ] Handles invalid placeholders gracefully
- [ ] Shows appropriate error messages
- [ ] Doesn't crash on edge cases

## Rollback Procedure

If critical issues are found:

### Quick Disable Charts

1. Comment out chart generation in `src/App.tsx`:

```typescript
// Build chart configurations from the data
const charts = buildChartConfigs(data);

// Temporarily disable charts
const charts = [];
```

2. Commit and deploy frontend

### Full Rollback

1. Get previous edge function version:
```bash
supabase functions list --project-ref qnbxemqvfzzgkxchtbhb
```

2. Revert to previous version or delete the edge function updates

3. Revert frontend changes:
```bash
git revert <commit-hash>
```

## Monitoring in Production

### Metrics to Watch

1. **Edge Function Metrics** (Supabase Dashboard)
   - Invocation count
   - Error rate
   - Average duration
   - Memory usage

2. **User Feedback**
   - Are charts appearing correctly?
   - Any reports of failures?
   - Performance complaints?

3. **Error Logs**
   - Check Supabase logs daily for first week
   - Set up alerts for error spikes

### Success Indicators

- ✅ Error rate < 1%
- ✅ Average generation time < 15 seconds
- ✅ No user complaints about positioning
- ✅ Data accuracy is 100%
- ✅ No crashes or timeouts

## Documentation Updates

After successful deployment:

- [ ] Update main README with chart feature
- [ ] Add example template to documentation
- [ ] Create video/screenshot tutorial (optional)
- [ ] Update API documentation if needed
- [ ] Announce feature to users

## Support Resources

### For Users Having Issues

1. **Check template setup:**
   - Placeholder names are exact (case-sensitive)
   - Template is shared properly
   - Text boxes are standard (not shapes)

2. **Check edge function logs:**
   ```bash
   supabase functions logs slides-generator --tail
   ```

3. **Common solutions:**
   - Re-authenticate for OAuth scopes
   - Verify template placeholders
   - Check API key permissions

### For Developers

- **Code location:** `/supabase/functions/slides-generator/`
- **Documentation:** `CHARTS_README.md` and `TESTING_GUIDE.md`
- **Edge function logs:** Supabase Dashboard → Edge Functions → slides-generator
- **Frontend monitoring:** Browser DevTools console

## Final Checklist

Before marking deployment complete:

- [ ] Edge function deployed successfully
- [ ] Frontend deployed (if applicable)
- [ ] End-to-end test passed
- [ ] Documentation updated
- [ ] Monitoring enabled
- [ ] Team notified
- [ ] Rollback plan understood
- [ ] Support resources available

## Notes

**Deployment Date:** _________________

**Deployed By:** _________________

**Production Template ID:** _________________

**Issues Encountered:**
_________________
_________________

**Resolution:**
_________________
_________________
