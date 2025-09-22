/**
 * Token Managers for Enterprise and Apigee LLM providers
 * TypeScript equivalent of Python token management classes
 */

import { TokenInfo, ApigeeTokenCache, LLMError, LLMProvider } from './llm-types';

export class ApigeeTokenManager {
  private apigeeLoginUrl: string;
  private apigeeConsumerKey: string;
  private apigeeConsumerSecret: string;
  private tokenCache: ApigeeTokenCache;
  private tokenLock: boolean = false;

  constructor() {
    this.apigeeLoginUrl = process.env.APIGEE_NONPROD_LOGIN_URL || '';
    this.apigeeConsumerKey = process.env.APIGEE_CONSUMER_KEY || '';
    this.apigeeConsumerSecret = process.env.APIGEE_CONSUMER_SECRET || '';
    
    this.tokenCache = {
      token: null,
      expiresAt: 0
    };

    if (!this.apigeeLoginUrl || !this.apigeeConsumerKey || !this.apigeeConsumerSecret) {
      throw new LLMError(
        'Apigee configuration incomplete. Required: APIGEE_NONPROD_LOGIN_URL, APIGEE_CONSUMER_KEY, APIGEE_CONSUMER_SECRET',
        LLMProvider.APIGEE
      );
    }
  }

  private async generateApigeeToken(): Promise<{ access_token: string; expires_in: number }> {
    // Encode consumer key and secret for Basic Authorization header
    const apigeeCreds = `${this.apigeeConsumerKey}:${this.apigeeConsumerSecret}`;
    const apigeeCredB64 = btoa(apigeeCreds);

    const payload = 'grant_type=client_credentials';
    const headers = {
      'Authorization': `Basic ${apigeeCredB64}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    console.log('Attempting to generate new Apigee token...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(this.apigeeLoginUrl, {
        method: 'POST',
        headers,
        body: payload,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new LLMError(
          `HTTP error generating Apigee token: ${response.status} - ${errorText}`,
          LLMProvider.APIGEE,
          response.status
        );
      }

      const tokenData = await response.json();
      console.log('Successfully generated Apigee token.');
      return tokenData;

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new LLMError(
            'Request to Apigee token endpoint timed out after 10 seconds.',
            LLMProvider.APIGEE
          );
        }
        throw new LLMError(
          `Could not connect to Apigee token endpoint: ${error.message}`,
          LLMProvider.APIGEE,
          undefined,
          error
        );
      }
      throw error;
    }
  }

  async getApigeeToken(): Promise<string> {
    // Simple lock mechanism (in production, consider using a proper mutex)
    while (this.tokenLock) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.tokenLock = true;

    try {
      const currentTime = Date.now() / 1000; // Convert to seconds

      // Check if we have a valid cached token
      if (this.tokenCache.token && currentTime < this.tokenCache.expiresAt) {
        return this.tokenCache.token;
      }

      // Generate new token
      const tokenData = await this.generateApigeeToken();

      // Cache the token with 1 minute buffer
      this.tokenCache.token = tokenData.access_token;
      this.tokenCache.expiresAt = currentTime + tokenData.expires_in - 60;

      return tokenData.access_token;

    } finally {
      this.tokenLock = false;
    }
  }
}

export class EnterpriseTokenManager {
  private refreshUrl: string;
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private tokenInfo: TokenInfo | null = null;
  private tokenLock: boolean = false;

  constructor() {
    this.refreshUrl = process.env.ENTERPRISE_LLM_REFRESH_URL || '';
    this.clientId = process.env.ENTERPRISE_LLM_CLIENT_ID || '';
    this.clientSecret = process.env.ENTERPRISE_LLM_CLIENT_SECRET || '';
    this.refreshToken = process.env.ENTERPRISE_LLM_REFRESH_TOKEN || '';

    // Load initial token if provided
    const initialToken = process.env.ENTERPRISE_LLM_TOKEN;
    if (initialToken) {
      const expiryHours = parseInt(process.env.ENTERPRISE_LLM_TOKEN_EXPIRY_HOURS || '24');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);
      
      this.tokenInfo = {
        token: initialToken,
        expiresAt,
        refreshToken: this.refreshToken
      };
    }
  }

  async getValidToken(): Promise<string> {
    // Simple lock mechanism
    while (this.tokenLock) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.tokenLock = true;

    try {
      if (!this.tokenInfo) {
        throw new LLMError(
          'No enterprise token configured. Set ENTERPRISE_LLM_TOKEN in environment',
          LLMProvider.ENTERPRISE
        );
      }

      // Check if token is expired or will expire in the next 5 minutes
      const fiveMinutesFromNow = new Date();
      fiveMinutesFromNow.setMinutes(fiveMinutesFromNow.getMinutes() + 5);

      if (new Date() >= new Date(this.tokenInfo.expiresAt.getTime() - 5 * 60 * 1000)) {
        console.log('Enterprise token expired or expiring soon, refreshing...');
        await this.refreshTokenMethod();
      }

      return this.tokenInfo.token;

    } finally {
      this.tokenLock = false;
    }
  }

  private async refreshTokenMethod(): Promise<void> {
    if (!this.refreshUrl) {
      throw new LLMError(
        'No refresh URL configured. Set ENTERPRISE_LLM_REFRESH_URL in environment',
        LLMProvider.ENTERPRISE
      );
    }

    if (!this.refreshToken && (!this.clientId || !this.clientSecret)) {
      throw new LLMError(
        'No refresh credentials configured',
        LLMProvider.ENTERPRISE
      );
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      
      let data: any;
      if (this.refreshToken) {
        data = {
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken
        };
      } else {
        data = {
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(this.refreshUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const tokenData = await response.json();
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));

        this.tokenInfo = {
          token: tokenData.access_token,
          expiresAt,
          refreshToken: tokenData.refresh_token || this.refreshToken
        };
        
        console.log('Successfully refreshed enterprise token');
      } else {
        const errorText = await response.text();
        throw new LLMError(
          `Token refresh failed: ${response.status} - ${errorText}`,
          LLMProvider.ENTERPRISE,
          response.status
        );
      }

    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to refresh enterprise token: ${errorMessage}`);
      throw new LLMError(
        `Failed to refresh enterprise token: ${errorMessage}`,
        LLMProvider.ENTERPRISE,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }
}
