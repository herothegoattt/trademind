# Deploy TradeMind Frontend → Azure App Service

## Architecture

```
Browser
  │
  ▼
trademindtech.com  ──────────────────────────────────────────┐
  │  (Azure App Service — Next.js Docker container)          │
  │                                                           │
  ├── /  /app/*  /auth/*  (Next.js pages)                    │
  ├── /api/chat /api/auth/* (Next.js API routes — server)    │
  └── /api/v1/* ──► BACKEND_INTERNAL_URL/api/v1/*            │
                      (reverse proxy → your FastAPI VPS)      │
                                                              │
                    FastAPI at http://VPS_IP:8000  ◄──────────┘
```

**Key point:** Next.js acts as a reverse proxy for FastAPI.  
The browser only talks to `trademindtech.com`. FastAPI's direct URL is never exposed.

---

## Step 1 — Create Azure Resources (one-time, via Azure CLI)

Install Azure CLI: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

```bash
# Log in
az login

# Create a resource group (change location if needed)
az group create \
  --name trademind-rg \
  --location eastus

# Create Azure Container Registry (stores your Docker images)
az acr create \
  --resource-group trademind-rg \
  --name trademindacr \
  --sku Basic \
  --admin-enabled true

# Get ACR credentials (save these for GitHub Secrets)
az acr credential show --name trademindacr
# → note loginServer, username, passwords[0].value

# Create App Service Plan (Linux B2 = ~$30/mo; B1 = ~$13/mo works too)
az appservice plan create \
  --name trademind-plan \
  --resource-group trademind-rg \
  --is-linux \
  --sku B2

# Create the Web App (container-based)
az webapp create \
  --name trademind-frontend \
  --resource-group trademind-rg \
  --plan trademind-plan \
  --deployment-container-image-name trademindacr.azurecr.io/trademind-frontend:latest

# Allow App Service to pull from ACR
az webapp config container set \
  --name trademind-frontend \
  --resource-group trademind-rg \
  --docker-registry-server-url https://trademindacr.azurecr.io \
  --docker-registry-server-user trademindacr \
  --docker-registry-server-password "<ACR_PASSWORD>"
```

---

## Step 2 — Set Runtime Environment Variables

These are set in Azure (NOT baked into the image). Go to:
**Azure Portal → App Services → trademind-frontend → Configuration → Application settings**

Or via CLI:

```bash
az webapp config appsettings set \
  --name trademind-frontend \
  --resource-group trademind-rg \
  --settings \
    WEBSITES_PORT=3000 \
    NODE_ENV=production \
    BACKEND_INTERNAL_URL="http://YOUR_VPS_IP:8000" \
    NEXT_PUBLIC_API_URL="https://trademindtech.com"
```

**Important:** Replace `YOUR_VPS_IP` with the actual IP address of your FastAPI server.  
This is how Next.js knows where to proxy `/api/v1/*` requests.

Copy any other secrets your app needs (JWT secret, push keys, etc.):

```bash
az webapp config appsettings set \
  --name trademind-frontend \
  --resource-group trademind-rg \
  --settings \
    JWT_SECRET="your-jwt-secret" \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id" \
    ANTHROPIC_API_KEY="your-api-key"
```

---

## Step 3 — Set Up GitHub Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|---|---|
| `ACR_LOGIN_SERVER` | `trademindacr.azurecr.io` |
| `ACR_USERNAME` | `trademindacr` |
| `ACR_PASSWORD` | *(from `az acr credential show`)* |
| `AZURE_WEBAPP_NAME` | `trademind-frontend` |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | *(see below)* |

**Get publish profile:**
```bash
az webapp deployment list-publishing-profiles \
  --name trademind-frontend \
  --resource-group trademind-rg \
  --xml
```
Copy the entire XML output and paste it as the `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

---

## Step 4 — First Manual Deploy (or trigger CI)

**Option A — Push to main branch** (GitHub Actions will build & deploy automatically)

**Option B — Manual Docker deploy:**
```bash
cd frontend

# Build
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://trademindtech.com \
  -t trademindacr.azurecr.io/trademind-frontend:latest .

# Push
az acr login --name trademindacr
docker push trademindacr.azurecr.io/trademind-frontend:latest

# Restart the App Service to pull the new image
az webapp restart \
  --name trademind-frontend \
  --resource-group trademind-rg
```

---

## Step 5 — Point trademindtech.com to Azure

Your App Service URL is: `https://trademind-frontend.azurewebsites.net`

### Option A: Custom domain on Azure App Service

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name trademind-frontend \
  --resource-group trademind-rg \
  --hostname trademindtech.com

# Azure will give you a verification ID — add it as a TXT record first,
# then add A record pointing to the App Service IP.
az webapp config hostname list \
  --webapp-name trademind-frontend \
  --resource-group trademind-rg
```

In your DNS provider (Cloudflare / GoDaddy / etc.):
```
Type  Name              Value
TXT   asuid             <verification-id-from-Azure>
A     @                 <Azure-App-Service-IP>
CNAME www               trademind-frontend.azurewebsites.net
```

### Option B: Use Cloudflare as proxy (recommended if you use Cloudflare)

1. Add A record: `trademindtech.com` → Azure App Service IP, **Proxied ON**
2. In Azure App Service, add the custom domain as above
3. Set SSL in Azure: **TLS/SSL settings → Managed Certificate → Add binding**

---

## Step 6 — Enable HTTPS (Managed Certificate)

```bash
# Create a free Azure-managed TLS certificate
az webapp config ssl create \
  --name trademind-frontend \
  --resource-group trademind-rg \
  --hostname trademindtech.com

# Bind the certificate
az webapp config ssl bind \
  --name trademind-frontend \
  --resource-group trademind-rg \
  --certificate-thumbprint <THUMBPRINT_FROM_ABOVE> \
  --ssl-type SNI

# Force HTTPS
az webapp update \
  --name trademind-frontend \
  --resource-group trademind-rg \
  --https-only true
```

---

## FastAPI Backend: What Needs to Change

Your FastAPI stays on its current VPS. You need to:

1. **Know its IP** — run `curl ifconfig.me` on the VPS. Set this as `BACKEND_INTERNAL_URL=http://VPS_IP:8000` in Azure.

2. **Allow Azure to reach it** — if your VPS has a firewall, whitelist Azure's outbound IPs:
   ```bash
   # Get App Service outbound IPs
   az webapp show \
     --name trademind-frontend \
     --resource-group trademind-rg \
     --query outboundIpAddresses
   ```
   Add each IP to your VPS firewall / security group for port 8000.

3. **CORS on FastAPI** — add `trademindtech.com` to FastAPI's allowed origins:
   ```python
   # In your FastAPI main.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://trademindtech.com"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

---

## Verify Everything Works

```bash
# Check the app is running
curl https://trademind-frontend.azurewebsites.net

# Check the proxy to FastAPI works
curl https://trademind-frontend.azurewebsites.net/api/v1/health

# Check logs if something is wrong
az webapp log tail \
  --name trademind-frontend \
  --resource-group trademind-rg
```

---

## Quick Reference: Monthly Cost

| Resource | SKU | ~Cost/mo |
|---|---|---|
| App Service Plan | B2 (2 vCPU, 3.5 GB RAM) | ~$60 |
| App Service Plan | B1 (1 vCPU, 1.75 GB RAM) | ~$13 |
| Container Registry | Basic | ~$5 |
| Managed TLS cert | Free | $0 |
| **Total** | B1 + ACR | **~$18/mo** |

B1 is enough for a start. Upgrade to B2/B3 if you need more memory.
