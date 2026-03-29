# VoiceVault Walrus Integration Guide

VoiceVault uses **Walrus** for decentralized blob storage of voice models and manifests on the Sui blockchain.

## Architecture

- **Walrus**: Content-addressed blob storage (manifests, embeddings, config files)
- **Sui Blockchain**: Ownership, permissions, and payment contracts
- **Backend**: FastAPI proxy for Walrus operations

## Setup

### 1. Backend Configuration

Copy the example env file and configure:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# Storage mode: 'local' for development, 'remote' for Walrus network
WALRUS_STORAGE_MODE=local

# For remote Walrus deployment
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=http://localhost:8000/api/walrus
WALRUS_EPOCHS=5
```

### 2. Install Python Dependencies

```bash
cd backend
python -m venv venv

# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Start Backend Server

```bash
python server.py
```

Backend will be available at `http://localhost:8000`

### 4. Frontend Configuration

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_WALRUS_AGGREGATOR_URL=http://localhost:8000/api/walrus
VITE_PROXY_URL=http://localhost:3001
```

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`

## API Endpoints

### Upload Voice Bundle

**POST** `/api/voice/process`
```bash
curl -X POST http://localhost:8000/api/voice/process \
  -F "audio=@voice.wav" \
  -F "name=My Voice" \
  -F "description=Voice description" \
  -F "owner=0x1234..." \
  -F "voiceId=voice-123"
```

Response:
```json
{
  "success": true,
  "uri": "walrus://blob_id_here",
  "cid": "0xhash_here",
  "bundle": {
    "config": {...},
    "meta": {...}
  }
}
```

### Download File from Walrus

**POST** `/api/walrus/download`
```bash
curl -X POST http://localhost:8000/api/walrus/download \
  -H "Content-Type: application/json" \
  -d '{
    "uri": "walrus://blob_id_here",
    "filename": "embedding.bin",
    "requesterAccount": "0xuser..."
  }'
```

### Generate TTS from Walrus Voice

**POST** `/api/tts/generate`
```bash
curl -X POST http://localhost:8000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "modelUri": "walrus://blob_id_here",
    "text": "Hello world",
    "requesterAccount": "0xuser..."
  }'
```

## How It Works

### 1. Upload Flow

1. User uploads voice audio on frontend
2. Frontend sends to `/api/voice/process`
3. Backend processes audio and creates bundle:
   - `embedding.bin` - Voice model embeddings
   - `config.json` - Model configuration
   - `preview.wav` - Preview audio
   - `meta.json` - Voice metadata
4. Backend uploads all files to Walrus storage
5. Backend receives manifest blob ID and returns `walrus://` URI
6. Frontend auto-fills URI in registration form
7. User registers voice on-chain with Sui smart contract

### 2. Download Flow

1. User requests voice file from marketplace
2. Frontend calls `/api/walrus/download`
3. Backend verifies access via Sui smart contract
4. Backend parses `walrus://` URI to get blob IDs
5. Backend downloads files from Walrus storage
6. Files returned to frontend

### 3. Walrus URI Format

```
walrus://{manifest_blob_id}
```

The manifest blob contains a JSON object with references to all voice files:

```json
{
  "voiceId": "voice-123",
  "owner": "0x1234...",
  "blobs": {
    "embedding.bin": { "blobId": "..." },
    "config.json": { "blobId": "..." },
    "preview.wav": { "blobId": "..." }
  },
  "manifestBlobId": "blob_id_here",
  "walrusUri": "walrus://blob_id_here"
}
```

## Storage Modes

### Local Development (`WALRUS_STORAGE_MODE=local`)

- Stores files locally in `backend/storage/walrus/`
- No external dependencies
- Suitable for testing and development
- CID is SHA256 hash of data

### Remote Production (`WALRUS_STORAGE_MODE=remote`)

- Uploads to real Walrus network
- Uses Walrus Publisher for uploads
- Uses Walrus Aggregator for downloads
- Content-addressed blobs
- Set `WALRUS_PUBLISHER_URL` and `WALRUS_AGGREGATOR_URL`

## Error Handling

| Status | Error | Solution |
|--------|-------|----------|
| 400 | Missing parameters | Check request body has uri, filename, etc. |
| 403 | Access denied | User must purchase voice in marketplace |
| 404 | Blob not found | Check Walrus URI is correct |
| 500 | Upload failed | Check backend logs, Walrus connection |

## Debugging

### Stop Backend Server

```bash
Ctrl+C
```

### View Local Storage

```bash
ls -la backend/storage/walrus/
```

### Check Walrus Connection (Remote Mode)

```bash
curl https://publisher.walrus-testnet.walrus.space/health
```

### Troubleshooting

1. **"Blob not found"** - Verify blob ID exists in Walrus
2. **"Access denied"** - Ensure user owns/purchased the voice on Sui
3. **Upload fails** - Check backend has write permissions to `backend/storage/walrus/`
4. **Different blob IDs** - Normal if using chunked uploads for large files