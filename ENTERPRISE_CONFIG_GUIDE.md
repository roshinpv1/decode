# Enterprise LLM Configuration Guide

## 🏢 **Enterprise LLM Setup**

### **Step 1: Basic Configuration**

Add these environment variables to your `.env.local` file:

```bash
# =============================================================================
# ENTERPRISE LLM CONFIGURATION
# =============================================================================

# Basic Enterprise Settings
ENTERPRISE_LLM_URL=https://your-enterprise-llm-endpoint.com/api/v1/chat
ENTERPRISE_LLM_MODEL=your-model-name
ENTERPRISE_LLM_API_KEY=your_enterprise_api_key

# Configuration Parameters
ENTERPRISE_LLM_TEMPERATURE=0.1
ENTERPRISE_LLM_MAX_TOKENS=4000
ENTERPRISE_LLM_TIMEOUT=600000

# Initial Bearer Token (if you have one)
ENTERPRISE_LLM_TOKEN=your_initial_bearer_token
ENTERPRISE_LLM_TOKEN_EXPIRY_HOURS=24
```

### **Step 2: Token Refresh Configuration**

For automatic token refresh (recommended for production):

```bash
# Token Refresh Settings
ENTERPRISE_LLM_REFRESH_URL=https://your-auth-server.com/oauth/token
ENTERPRISE_LLM_CLIENT_ID=your_oauth_client_id
ENTERPRISE_LLM_CLIENT_SECRET=your_oauth_client_secret
ENTERPRISE_LLM_REFRESH_TOKEN=your_initial_refresh_token
```

### **Step 3: Custom Headers (Optional)**

Add any custom headers required by your enterprise API:

```bash
# Custom Headers (JSON format)
ENTERPRISE_LLM_HEADERS={"X-API-Version": "v1", "X-Client-Name": "hackathon-chatbot", "X-Department": "AI-Research"}
```

## 🔧 **Configuration Examples**

### **Example 1: Basic Enterprise Setup**
```bash
ENTERPRISE_LLM_URL=https://ai-gateway.mycompany.com/api/v1/generate
ENTERPRISE_LLM_MODEL=llama-3-70b-enterprise
ENTERPRISE_LLM_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ENTERPRISE_LLM_TOKEN_EXPIRY_HOURS=8
```

### **Example 2: OAuth with Refresh Token**
```bash
ENTERPRISE_LLM_URL=https://enterprise-ai.internal.com/v1/chat
ENTERPRISE_LLM_MODEL=gpt-4-enterprise
ENTERPRISE_LLM_REFRESH_URL=https://auth.internal.com/oauth/token
ENTERPRISE_LLM_CLIENT_ID=hackathon-app-12345
ENTERPRISE_LLM_CLIENT_SECRET=secret_abc123def456
ENTERPRISE_LLM_REFRESH_TOKEN=refresh_token_xyz789
```

### **Example 3: Client Credentials Flow**
```bash
ENTERPRISE_LLM_URL=https://ai-platform.enterprise.com/api/inference
ENTERPRISE_LLM_MODEL=claude-3-enterprise
ENTERPRISE_LLM_REFRESH_URL=https://oauth.enterprise.com/token
ENTERPRISE_LLM_CLIENT_ID=service-account-ai-bot
ENTERPRISE_LLM_CLIENT_SECRET=super_secret_client_credential
ENTERPRISE_LLM_HEADERS={"X-Service": "hackathon", "X-Environment": "production"}
```

## 🔐 **Authentication Methods**

### **Method 1: Static Bearer Token**
```bash
# Simple bearer token (manually managed)
ENTERPRISE_LLM_TOKEN=your_bearer_token_here
ENTERPRISE_LLM_TOKEN_EXPIRY_HOURS=24
```

### **Method 2: Refresh Token Flow**
```bash
# OAuth 2.0 Refresh Token Grant
ENTERPRISE_LLM_REFRESH_URL=https://auth.company.com/oauth/token
ENTERPRISE_LLM_REFRESH_TOKEN=your_refresh_token
ENTERPRISE_LLM_CLIENT_ID=your_client_id
ENTERPRISE_LLM_CLIENT_SECRET=your_client_secret
```

### **Method 3: Client Credentials Flow**
```bash
# OAuth 2.0 Client Credentials Grant
ENTERPRISE_LLM_REFRESH_URL=https://auth.company.com/oauth/token
ENTERPRISE_LLM_CLIENT_ID=your_service_account_id
ENTERPRISE_LLM_CLIENT_SECRET=your_service_account_secret
# No refresh token needed for client credentials
```

## 📡 **API Request Format**

The system will send requests in this format:

```json
{
  "model": "your-model-name",
  "prompt": "System prompt + user message",
  "temperature": 0.1,
  "max_tokens": 4000
}
```

**Headers sent:**
```
Authorization: Bearer <token>
Content-Type: application/json
X-Custom-Header: <value>  // If configured
```

**Expected Response:**
```json
{
  "response": "AI generated response text"
}
```

## 🧪 **Testing Your Configuration**

### **Test 1: Check Provider Availability**
```bash
curl http://localhost:3000/api/llm/providers
```

Should show `enterprise` in the available providers list.

### **Test 2: Test Enterprise Provider Directly**
```bash
curl -X POST http://localhost:3000/api/llm/providers \
  -H "Content-Type: application/json" \
  -d '{"provider": "enterprise", "testPrompt": "Hello from enterprise LLM!"}'
```

### **Test 3: Use in Chat**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test enterprise integration"}'
```

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **"Enterprise token manager not initialized"**
   - Ensure `ENTERPRISE_LLM_URL` is set
   - Check that `ENTERPRISE_LLM_TOKEN` or refresh credentials are provided

2. **"No refresh credentials configured"**
   - Set either `ENTERPRISE_LLM_REFRESH_TOKEN` or both `CLIENT_ID` and `CLIENT_SECRET`

3. **"Enterprise LLM request failed: 401"**
   - Token expired or invalid
   - Check token refresh configuration
   - Verify client credentials

4. **"Enterprise LLM request failed: 404"**
   - Check `ENTERPRISE_LLM_URL` is correct
   - Verify API endpoint path

5. **"Failed to refresh enterprise token"**
   - Check `ENTERPRISE_LLM_REFRESH_URL`
   - Verify client credentials
   - Check network connectivity to auth server

### **Debug Logging:**

The system provides detailed logging:
```
🤖 Using LLM Provider: enterprise:your-model-name
✅ LLM Response received from enterprise:your-model-name
```

Or error details:
```
⚠️ LLM Client failed (enterprise): Token refresh failed: 401 - Invalid credentials
🔄 Falling back to LM Studio...
```

## 🎯 **Priority Order**

Enterprise LLM has priority position #5 in the provider detection:

1. OpenAI
2. Anthropic  
3. Gemini
4. Apigee
5. **Enterprise** ← Your configuration
6. Local
7. Ollama

## 🔒 **Security Best Practices**

1. **Never commit tokens to version control**
2. **Use environment-specific .env files**
3. **Rotate tokens regularly**
4. **Use refresh tokens for long-running deployments**
5. **Monitor token expiry and refresh logs**
6. **Use client credentials flow for service accounts**

## 📋 **Quick Setup Checklist**

- [ ] Set `ENTERPRISE_LLM_URL`
- [ ] Set `ENTERPRISE_LLM_MODEL`
- [ ] Configure authentication (token or credentials)
- [ ] Test with `/api/llm/providers`
- [ ] Verify chat integration works
- [ ] Monitor logs for errors
- [ ] Set up token refresh (production)

Your enterprise LLM integration is now ready! 🚀
