# Comprehensive LLM Client System

This Next.js application now includes a comprehensive LLM client system that supports multiple providers with automatic failover, token management, and enterprise-grade features.

## 🚀 **Features**

### **Multi-Provider Support**
- **OpenAI** (GPT-4, GPT-3.5-turbo)
- **Anthropic** (Claude 3 Sonnet, Haiku, Opus)
- **Google Gemini** (Gemini Pro, Gemini Pro Vision)
- **Ollama** (Local open-source models)
- **Local LLM** (LM Studio, Oobabooga, etc.)
- **Enterprise LLM** (Custom enterprise endpoints)
- **Apigee Gateway** (Enterprise proxy with OAuth)

### **Advanced Features**
- **Automatic Provider Detection**: System automatically detects available providers from environment variables
- **Intelligent Failover**: Falls back to LM Studio if primary providers fail
- **Token Management**: Automatic token refresh for Enterprise and Apigee providers
- **Thread-Safe Operations**: Safe concurrent access to token caches
- **Comprehensive Logging**: Detailed request/response logging with provider tracking
- **Timeout Handling**: Configurable timeouts with AbortController
- **Error Handling**: Detailed error reporting with provider-specific messages

## 📁 **File Structure**

```
lib/
├── llm-types.ts          # TypeScript interfaces and enums
├── token-managers.ts     # Enterprise and Apigee token management
├── llm-client.ts         # Main LLM client class
└── llm-factory.ts        # Client factory and utility functions

app/api/
├── chat/route.ts         # Updated chat endpoint with new LLM system
└── llm/providers/route.ts # Provider testing and information endpoint
```

## 🔧 **Configuration**

### **Environment Variables**

Copy `env.example.txt` to `.env.local` and configure your preferred provider(s):

#### **Quick Start (Local Development)**
```bash
# For LM Studio
LM_STUDIO_URL=http://localhost:1234/v1/chat/completions

# For Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama-3.2-3b-instruct
```

#### **Cloud Providers**
```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro
```

#### **Enterprise Configuration**
```bash
# Enterprise LLM
ENTERPRISE_LLM_URL=https://your-enterprise-llm-endpoint.com
ENTERPRISE_LLM_TOKEN=your_bearer_token
ENTERPRISE_LLM_REFRESH_URL=https://your-token-refresh-endpoint.com

# Apigee Gateway
APIGEE_NONPROD_LOGIN_URL=https://your-apigee-login-endpoint.com/oauth/token
APIGEE_CONSUMER_KEY=your_consumer_key
APIGEE_CONSUMER_SECRET=your_consumer_secret
ENTERPRISE_BASE_URL=https://your-enterprise-base-url.com
```

## 🏗️ **Usage**

### **Automatic Provider Selection**

The system automatically detects and uses the first available provider:

1. **OpenAI** (if `OPENAI_API_KEY` is set)
2. **Anthropic** (if `ANTHROPIC_API_KEY` is set)  
3. **Gemini** (if `GEMINI_API_KEY` is set)
4. **Apigee** (if `APIGEE_NONPROD_LOGIN_URL` is set)
5. **Enterprise** (if `ENTERPRISE_LLM_URL` is set)
6. **Local** (if `LOCAL_LLM_URL` is set)
7. **Ollama** (if `OLLAMA_HOST` is set)
8. **LM Studio** (fallback if others fail)

### **Manual Provider Configuration**

```typescript
import { LLMClient, createConfigForProvider } from './lib/llm-client'
import { LLMProvider } from './lib/llm-types'

// Create a specific provider client
const config = createConfigForProvider(LLMProvider.OPENAI)
const client = new LLMClient(config)

// Call the LLM
const response = await client.callLLM("Hello, world!")
```

### **Using the Factory Function**

```typescript
import { callLLM } from './lib/llm-factory'

// Simple call with automatic provider selection
const response = await callLLM("Hello, world!")

// With timeout
const response = await callLLM("Hello, world!", false, 30000)
```

## 🔍 **API Endpoints**

### **Chat Endpoint**
```
POST /api/chat
{
  "message": "Your message here",
  "sessionId": "optional-session-id"
}
```

### **Provider Information**
```
GET /api/llm/providers
```
Returns list of available providers and their configuration.

### **Provider Testing**
```
POST /api/llm/providers
{
  "provider": "openai",
  "testPrompt": "Hello, respond with 'Test successful!'"
}
```
Tests a specific provider with a custom prompt.

## 🛡️ **Enterprise Features**

### **Token Management**

#### **Enterprise Token Manager**
- Automatic token refresh using refresh tokens or client credentials
- Thread-safe token caching
- Configurable expiry with buffer time
- Support for custom headers

#### **Apigee Token Manager**
- OAuth 2.0 client credentials flow
- Bearer token caching with expiry tracking
- Base64 credential encoding
- Automatic retry logic

### **Request Tracking**
- Unique request IDs
- Correlation IDs for distributed tracing
- Custom enterprise headers
- Comprehensive audit logging

## 🔧 **Error Handling**

The system provides detailed error information:

```typescript
try {
  const response = await callLLM("Hello, world!")
} catch (error) {
  if (error instanceof LLMError) {
    console.log(`Provider: ${error.provider}`)
    console.log(`Status: ${error.statusCode}`)
    console.log(`Message: ${error.message}`)
  }
}
```

## 📊 **Monitoring & Logging**

### **Request Logging**
All requests are logged with:
- Timestamp
- Client IP
- Provider used
- Response time
- Token usage (if available)
- Error details

### **Provider Health**
Monitor provider availability:
```bash
curl http://localhost:3001/api/llm/providers
```

## 🧪 **Testing**

### **Test All Providers**
```bash
curl http://localhost:3001/api/llm/providers
```

### **Test Specific Provider**
```bash
curl -X POST http://localhost:3001/api/llm/providers \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai", "testPrompt": "Hello!"}'
```

### **Chat Test**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

## 🔄 **Migration from Python**

This TypeScript implementation provides feature parity with the original Python script:

| Python Feature | TypeScript Equivalent |
|----------------|----------------------|
| `LLMProvider` enum | `LLMProvider` enum |
| `LLMConfig` dataclass | `LLMConfig` interface |
| `LLMClient` class | `LLMClient` class |
| `ApigeeTokenManager` | `ApigeeTokenManager` class |
| `EnterpriseTokenManager` | `EnterpriseTokenManager` class |
| `call_llm()` function | `callLLM()` function |
| `create_llm_client_from_env()` | `createLLMClientFromEnv()` |

### **Key Differences**
- **Async/Await**: All operations are promise-based
- **Fetch API**: Uses Web Fetch instead of requests library
- **AbortController**: For timeout handling instead of thread timeouts
- **Next.js Integration**: Built for serverless function deployment

## 🚀 **Quick Start**

1. **Copy environment configuration**:
   ```bash
   cp env.example.txt .env.local
   ```

2. **Configure at least one provider** in `.env.local`

3. **Start the application**:
   ```bash
   npm run dev
   ```

4. **Test the system**:
   ```bash
   curl http://localhost:3001/api/llm/providers
   ```

5. **Use the chat interface** at `http://localhost:3001`

## 🔮 **Future Enhancements**

- **Caching Layer**: Response caching with TTL
- **Rate Limiting**: Per-provider rate limiting
- **Metrics Collection**: Detailed usage analytics
- **Load Balancing**: Round-robin across multiple endpoints
- **Circuit Breaker**: Automatic provider failover
- **Streaming Support**: Real-time streaming responses

---

This LLM client system provides enterprise-grade reliability and flexibility while maintaining backward compatibility with your existing chat application.
