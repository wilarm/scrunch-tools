const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/presentations',
];

interface AuthConfig {
  clientId: string;
  redirectUri: string;
}

function getAuthConfig(): AuthConfig {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not configured');
  }

  return {
    clientId,
    redirectUri: `${window.location.origin}/slides/oauth/callback`,
  };
}

// Generate random string for state parameter
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function initiateGoogleAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const config = getAuthConfig();
      const state = generateRandomString(32);

      // Store state for verification
      sessionStorage.setItem('oauth_state', state);

      // Build auth URL
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'token',
        scope: SCOPES.join(' '),
        state,
      });

      const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

      // Open popup window
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'Google OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        reject(new Error('Failed to open popup window. Please allow popups for this site.'));
        return;
      }

      // Listen for messages from popup
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'oauth_success') {
          window.removeEventListener('message', messageHandler);
          popup.close();
          resolve(event.data.accessToken);
        } else if (event.data.type === 'oauth_error') {
          window.removeEventListener('message', messageHandler);
          popup.close();
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          reject(new Error('Authentication cancelled'));
        }
      }, 500);
    } catch (error) {
      reject(error);
    }
  });
}

export function handleOAuthCallback(): void {
  try {
    // Parse hash fragment for access token
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      window.opener.postMessage(
        { type: 'oauth_error', error: error },
        window.location.origin
      );
      return;
    }

    // Verify state parameter
    const savedState = sessionStorage.getItem('oauth_state');
    if (!state || state !== savedState) {
      window.opener.postMessage(
        { type: 'oauth_error', error: 'Invalid state parameter' },
        window.location.origin
      );
      return;
    }

    if (!accessToken) {
      window.opener.postMessage(
        { type: 'oauth_error', error: 'No access token received' },
        window.location.origin
      );
      return;
    }

    // Clean up
    sessionStorage.removeItem('oauth_state');

    // Send token to parent window
    window.opener.postMessage(
      { type: 'oauth_success', accessToken },
      window.location.origin
    );
  } catch (error) {
    window.opener.postMessage(
      { type: 'oauth_error', error: error instanceof Error ? error.message : 'Unknown error' },
      window.location.origin
    );
  }
}

// Check if current page is OAuth callback
export function isOAuthCallback(): boolean {
  return window.location.pathname.includes('/oauth/callback');
}
