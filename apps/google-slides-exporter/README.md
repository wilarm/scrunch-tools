# Google Slides Generator

A tool to automatically generate Google Slides presentations from Scrunch API data.

## Features

- OAuth 2.0 authentication with Google
- Fetch brand-level metrics from Scrunch Query API
- Template-based slide generation with placeholder replacement
- Support for multiple metrics (presence %, position score, sentiment, etc.)
- Direct creation in user's Google Drive

## Setup

### 1. Google Cloud Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Slides API
   - Google Drive API
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Add authorized redirect URI: `https://your-domain.com/slides/oauth/callback` (or `http://localhost:5173/slides/oauth/callback` for local dev)
   - Copy the Client ID

### 2. Environment Variables

Create a `.env` file in this directory:

```bash
# Copy from .env.example
cp .env.example .env
```

Add your credentials:

```bash
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Supabase Edge Function

Deploy the Supabase Edge Function:

```bash
cd supabase/functions/slides-generator
supabase functions deploy slides-generator
```

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Visit http://localhost:5173/slides/
```

## Creating a Template

1. Create a new Google Slides presentation
2. Add placeholders using double curly braces:
   - `{{brand_name}}` - Brand identifier
   - `{{brand_id}}` - Brand ID
   - `{{date_range}}` - Full date range (e.g., "2024-01-01 to 2024-01-31")
   - `{{start_date}}` - Start date
   - `{{end_date}}` - End date
   - `{{presence_pct}}` - Brand presence percentage
   - `{{total_responses}}` - Total response count
   - `{{position_score}}` - Brand position score
   - `{{sentiment_score}}` - Brand sentiment score
   - `{{competitor_presence_pct}}` - Competitor presence percentage
   - `{{competitor_position_score}}` - Competitor position score
   - `{{competitor_sentiment_score}}` - Competitor sentiment score

3. Share the template with "Anyone with the link" (View access)
4. Copy the template ID from the URL: `https://docs.google.com/presentation/d/TEMPLATE_ID/edit`

## Usage

### Using the Default Template (Recommended)

1. Enter your Scrunch API credentials
2. Specify brand ID and date range
3. Select which metrics to include
4. Enter a name for your output deck
5. Click "Generate Slides"
6. Authenticate with Google (if not already authenticated)
7. Wait for generation to complete
8. Open your new presentation in Google Drive

### Using a Custom Template

1. Click "Use my own template" in the template section
2. Follow the instructions to create your custom template
3. Paste your Google Slides template URL or ID
4. Click "Test Template" to validate
5. Continue with steps 2-8 from above

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **OAuth**: Google OAuth 2.0 with PKCE (Implicit flow)
- **API Integration**: Supabase Edge Function proxy to Scrunch API
- **Slides API**: Supabase Edge Function calls Google Slides API
- **Deployment**: Vercel

## Security

- Access tokens are stored in sessionStorage and never sent to Scrunch API
- Only sent to Google APIs via Supabase Edge Function
- PKCE flow protects against authorization code interception
- Users create slides in their own Google Drive (no service account needed)

## Troubleshooting

### "Failed to open popup window"
- Enable popups for this site in your browser settings

### "Template validation failed"
- Ensure the template is shared with "Anyone with the link"
- Check that the template ID is correct
- Verify you have access to the template

### "Authentication cancelled"
- The popup was closed before completing authentication
- Try again and complete the Google login flow

### "No data found for the specified date range"
- Check that your API key and brand ID are correct
- Verify that there is data for the selected date range
- Ensure at least one metric is selected

## License

Internal tool for Scrunch customers.
