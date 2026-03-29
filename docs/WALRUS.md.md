# VoiceVault: Shelby → Walrus Migration Guide

## TL;DR

Replace Shelby (Aptos-coordinated, account-namespaced blob storage with paid reads/sessions) with **Walrus** (Sui-native, content-addressed blob storage with free reads via Aggregator). Since VoiceVault already uses Sui for smart contracts, Walrus is a natural fit — it eliminates the Aptos dependency entirely and gives you on-chain Blob objects that your existing Sui Move contracts can reference directly.

---

## Architecture: Before & After

```
BEFORE (Shelby + Aptos + Sui)
───────────────────────────────
Frontend → FastAPI Backend
                │
        ┌───────┴────────┐
        │                │
  Shelby RPC         Sui Blockchain
  (Aptos-coord)     (Smart Contracts)
        │
  Aptos Blockchain
  (Blob registration,
   sessions, micropayments)


AFTER (Walrus + Sui only)
──────────────────────────
Frontend → FastAPI Backend
                │
        ┌───────┴────────┐
        │                │
  Walrus Publisher    Sui Blockchain
  & Aggregator       (Smart Contracts +
  (HTTP API)          Blob Objects)
```

What you're dropping:

- Aptos blockchain dependency (sessions, micropayment channels, `ShelbyBlobClient.registerBlob()`)
- `@shelby-protocol/sdk` and `@aptos-labs/ts-sdk`
- Shelby API keys
- shelbyUSD payment tokens for reads

What you're gaining:

- Single-chain architecture (everything on Sui)
- Free reads via public Aggregators (no sessions/micropayments needed)
- Content-addressed blob IDs (immutability built into the ID itself)
- On-chain Sui Blob objects your Move contracts can reference
- Quilt support for bundling multiple files into one blob

---

## 1. API Surface Mapping

### Shelby → Walrus: Exact Endpoint Translation

| Shelby API | Shelby Endpoint | Walrus Equivalent | Walrus Endpoint |
|---|---|---|---|
| Upload blob | `PUT /v1/blobs/{account}/{blobName}` | Store blob | `PUT {PUBLISHER}/v1/blobs?epochs=N` |
| Retrieve blob | `GET /v1/blobs/{account}/{blobName}` | Read blob | `GET {AGGREGATOR}/v1/blobs/{blobId}` |
| Multipart upload start | `POST /v1/multipart/{account}/{blobName}` | *(not needed — use Quilt or chunk manually)* | — |
| Create session | `POST /sessions` | *(not needed — reads are free)* | — |
| Create micropayment channel | `POST /sessions/micropayment` | *(not needed — no paid reads)* | — |
| Register blob on-chain | `ShelbyBlobClient.registerBlob()` (Aptos tx) | *(automatic — Publisher handles Sui tx)* | Built into `PUT /v1/blobs` |
| Get blob metadata | `ShelbyBlobClient.getBlobMetadata()` (Aptos) | Query Sui Blob object | Sui RPC / `@mysten/sui` SDK |
| Delete blob | `ShelbyBlobClient.deleteBlob()` (Aptos tx) | Delete blob (if deletable) | Sui tx on Blob object |

### Shelby → Walrus: SDK Translation

| Shelby SDK | Walrus SDK |
|---|---|
| `@shelby-protocol/sdk` | `walrus-python` (backend) / `@mysten/walrus` (frontend) |
| `@aptos-labs/ts-sdk` | `@mysten/sui` (you already have this) |
| `ShelbyRPCClient.putBlob({account, blobName, blobData})` | `client.put_blob(data=bytes, epochs=N)` |
| `ShelbyRPCClient.getBlob({account, blobName})` | `client.get_blob(blob_id)` |
| `ShelbyBlobClient.registerBlob(...)` | *(automatic in `PUT /v1/blobs`)* |
| Session/micropayment management | *(eliminated — reads are free)* |

### Shelby → Walrus: URI Format

```
SHELBY:
  PUT /v1/blobs/{account}/{blobName}
  Path-addressed: shelby://0xABCD/voices/my-voice-123
  Account-namespaced, user-defined names, up to 1024 chars

WALRUS:
  PUT {PUBLISHER}/v1/blobs?epochs=5
  Content-addressed: walrus://<blobId>
  blobId is a base64 string derived from the blob's content
  Same data = same blobId (deduplication is automatic)
```

Key difference: Shelby uses `{account}/{blobName}` paths (like a filesystem). Walrus returns a content-addressed `blobId` — you don't choose the ID. This means VoiceVault needs a **manifest pattern** to map voice bundles to their constituent blob IDs.

---

## 2. Environment Setup

### 2.1 Install Dependencies

**Backend (Python):**
```bash
pip install walrus-python
```

**Frontend (TypeScript) — remove Shelby, add Walrus:**
```bash
# Remove
npm uninstall @shelby-protocol/sdk @aptos-labs/ts-sdk

# Add (only if you need direct SDK access; HTTP API via backend is simpler)
npm install @mysten/walrus
```

### 2.2 Environment Variables

```env
# ─── REMOVE ───
# SHELBY_RPC_URL=https://api.shelbynet.shelby.xyz/shelby
# SHELBY_API_KEY=sk-...
# APTOS_NODE_URL=...
# APTOS_INDEXER_URL=...

# ─── ADD ───
# Testnet
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
WALRUS_EPOCHS=5
WALRUS_DELETABLE=true

# Mainnet (swap when ready)
# WALRUS_PUBLISHER_URL=https://publisher.walrus.space
# WALRUS_AGGREGATOR_URL=https://aggregator.walrus.space
# WALRUS_EPOCHS=365
# WALRUS_DELETABLE=false

# ─── KEEP ───
SUI_RPC_URL=https://fullnode.testnet.sui.io
SUI_WALLET_ADDRESS=0x...
```

### 2.3 Key Conceptual Differences

| Concept | Shelby | Walrus |
|---|---|---|
| **Coordination chain** | Aptos | Sui |
| **Blob addressing** | Account + path (`{account}/{blobName}`) | Content hash (`blobId`) |
| **Read cost** | Paid (sessions + micropayment channels + shelbyUSD) | Free (Aggregators serve data at no cost) |
| **Write cost** | Aptos gas + storage fees | SUI gas + WAL tokens (paid by Publisher) |
| **On-chain registration** | Separate step (`registerBlob` Aptos tx) | Automatic (Publisher handles Sui tx during upload) |
| **Erasure coding** | Clay Codes (10+6 across 16 SPs) | RedStuff (2D erasure, ~4.5x replication across ~2200 nodes) |
| **Chunking** | 10 MB chunksets, 1 MB chunks | Handled internally by Walrus |
| **Sessions** | Required for reads | Not needed |
| **Byte-range reads** | `Range: bytes=start-end` header | Not supported at HTTP level (download full blob) |
| **Max blob size** | No hard limit (multipart upload) | 10 MiB default per blob (configurable on Publisher) |
| **Multi-file bundles** | Multiple blobs with path names | Quilt (bundles multiple files as one blob) |
| **Deduplication** | None (same data, different name = separate blob) | Automatic (same data = same blobId, `alreadyCertified`) |

---

## 3. Backend Migration

### 3.1 Replace `backend/shelby.py` → `backend/walrus.py`

```python
"""
walrus.py — Walrus storage client for VoiceVault
Replaces shelby.py. Uses Walrus HTTP API via walrus-python SDK.
"""

import os
import json
import logging
from typing import Optional
from walrus import WalrusClient, WalrusAPIError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

PUBLISHER_URL = os.getenv(
    "WALRUS_PUBLISHER_URL", 
    "https://publisher.walrus-testnet.walrus.space"
)
AGGREGATOR_URL = os.getenv(
    "WALRUS_AGGREGATOR_URL", 
    "https://aggregator.walrus-testnet.walrus.space"
)
DEFAULT_EPOCHS = int(os.getenv("WALRUS_EPOCHS", "5"))
DELETABLE = os.getenv("WALRUS_DELETABLE", "true").lower() == "true"

client = WalrusClient(
    publisher_base_url=PUBLISHER_URL,
    aggregator_base_url=AGGREGATOR_URL,
)


# ---------------------------------------------------------------------------
# Upload (replaces upload_to_shelby)
# ---------------------------------------------------------------------------

def upload_to_walrus(
    voice_id: str,
    owner_address: str,
    embedding_bin: bytes,
    config_json: dict,
    meta_json: dict,
    preview_wav: bytes,
    epochs: int = DEFAULT_EPOCHS,
    send_object_to: Optional[str] = None,
) -> dict:
    """
    Upload a voice bundle to Walrus.
    
    SHELBY did: PUT /v1/blobs/{account}/voices/{voiceId}/embedding.bin (etc.)
    WALRUS does: PUT /v1/blobs?epochs=N for each file → returns blobId
    
    Since Walrus is content-addressed (no path-based naming), we upload
    each file as a separate blob, then upload a manifest blob that maps
    filenames → blobIds. The manifest blobId becomes the voice's URI.
    
    Returns:
    {
        "voiceId": "...",
        "owner": "0x...",
        "blobs": {
            "embedding.bin": {"blobId": "...", "objectId": "..."},
            "config.json":   {"blobId": "...", "objectId": "..."},
            "meta.json":     {"blobId": "...", "objectId": "..."},
            "preview.wav":   {"blobId": "...", "objectId": "..."},
        },
        "walrusUri": "walrus://<manifest_blob_id>",
    }
    """
    bundle_files = {
        "embedding.bin": embedding_bin,
        "config.json": json.dumps(config_json).encode("utf-8"),
        "meta.json": json.dumps(meta_json).encode("utf-8"),
        "preview.wav": preview_wav,
    }

    blobs = {}
    for filename, data in bundle_files.items():
        try:
            response = client.put_blob(
                data=data,
                epochs=epochs,
                deletable=DELETABLE,
                send_object_to=send_object_to or owner_address,
            )
            blob_id, object_id = _extract_ids(response)
            blobs[filename] = {"blobId": blob_id, "objectId": object_id}
            logger.info(f"Uploaded {filename} → blobId={blob_id}")
        except WalrusAPIError as e:
            logger.error(f"Failed to upload {filename}: {e}")
            raise

    # Upload a manifest that ties everything together
    manifest = {
        "voiceId": voice_id,
        "owner": owner_address,
        "blobs": blobs,
        "version": 1,
    }
    manifest_resp = client.put_blob(
        data=json.dumps(manifest).encode("utf-8"),
        epochs=epochs,
        deletable=DELETABLE,
        send_object_to=send_object_to or owner_address,
    )
    manifest_blob_id, _ = _extract_ids(manifest_resp)

    manifest["walrusUri"] = f"walrus://{manifest_blob_id}"
    logger.info(f"Bundle manifest → walrus://{manifest_blob_id}")
    return manifest


def _extract_ids(response: dict) -> tuple[str, str]:
    """Extract blobId and objectId from Walrus store response."""
    if "newlyCreated" in response:
        obj = response["newlyCreated"]["blobObject"]
        return obj["blobId"], obj["id"]
    elif "alreadyCertified" in response:
        return (
            response["alreadyCertified"]["blobId"],
            response["alreadyCertified"].get("event", {}).get("txDigest", ""),
        )
    raise ValueError(f"Unexpected Walrus response: {response}")


# ---------------------------------------------------------------------------
# Download (replaces download_from_shelby)
# ---------------------------------------------------------------------------

def download_from_walrus(blob_id: str) -> bytes:
    """
    Download a blob by its Walrus Blob ID.
    
    SHELBY did: GET /v1/blobs/{account}/{blobName} (+ session + micropayment)
    WALRUS does: GET {AGGREGATOR}/v1/blobs/{blobId} (free, no auth needed)
    """
    try:
        return client.get_blob(blob_id)
    except WalrusAPIError as e:
        logger.error(f"Failed to download blob {blob_id}: {e}")
        raise


def download_bundle(manifest_blob_id: str) -> dict:
    """Download the full voice bundle. Returns {filename: bytes}."""
    manifest = json.loads(download_from_walrus(manifest_blob_id))
    return {
        filename: download_from_walrus(info["blobId"])
        for filename, info in manifest["blobs"].items()
    }


def download_file(manifest_blob_id: str, filename: str) -> bytes:
    """Download a single file from a voice bundle."""
    manifest = json.loads(download_from_walrus(manifest_blob_id))
    blob_info = manifest["blobs"].get(filename)
    if not blob_info:
        raise FileNotFoundError(f"'{filename}' not in manifest")
    return download_from_walrus(blob_info["blobId"])


# ---------------------------------------------------------------------------
# Access verification (unchanged — still Sui smart contract)
# ---------------------------------------------------------------------------

def verify_access(requester: str, voice_owner: str, voice_id: str) -> bool:
    """
    Check Sui smart contract for access rights.
    This is UNCHANGED from the Shelby integration — Sui was already
    handling ACL, and Walrus doesn't replace that.
    """
    # Your existing Sui contract check here
    return True  # placeholder


# ---------------------------------------------------------------------------
# URI helpers
# ---------------------------------------------------------------------------

def parse_walrus_uri(uri: str) -> str:
    """walrus://<blobId> → blobId"""
    if not uri.startswith("walrus://"):
        raise ValueError(f"Invalid URI: {uri}")
    return uri[len("walrus://"):]


def build_walrus_uri(blob_id: str) -> str:
    return f"walrus://{blob_id}"


def get_aggregator_url(blob_id: str) -> str:
    """Direct HTTP URL to read a blob (can be used in <audio>, <img>, etc.)"""
    return f"{AGGREGATOR_URL}/v1/blobs/{blob_id}"
```

### 3.2 Update Routes in `backend/server.py`

```python
# ═══════════════════════════════════════════════════════════
# BEFORE (Shelby)
# ═══════════════════════════════════════════════════════════

@app.post("/api/voice/process")
async def process_voice(file: UploadFile, account: str = Header(alias="x-aptos-account")):
    # ... process audio ...
    shelby_uri = upload_to_shelby(account, "voices", voice_id, ...)
    return {"shelbyUri": shelby_uri, "cid": cid}

@app.post("/api/shelby/download")
async def download(body: DownloadRequest):
    # ... verify access on Sui ...
    # ... establish Shelby session + micropayment ...
    file_bytes = download_from_shelby(body.uri, body.filename)
    return Response(content=file_bytes)

@app.post("/api/tts/generate")
async def generate_tts(body: TTSRequest):
    # ... verify access ...
    embedding = download_from_shelby(body.model_uri, "embedding.bin")
    config = download_from_shelby(body.model_uri, "config.json")
    audio = generate_preview(embedding, json.loads(config), body.text)
    return Response(content=audio, media_type="audio/wav")


# ═══════════════════════════════════════════════════════════
# AFTER (Walrus)
# ═══════════════════════════════════════════════════════════

from walrus_client import (
    upload_to_walrus, download_file, parse_walrus_uri, 
    verify_access, get_aggregator_url
)

@app.post("/api/voice/process")
async def process_voice(
    file: UploadFile, 
    account: str = Header(alias="x-sui-account"),  # was x-aptos-account
):
    audio_bytes = await file.read()
    embedding, config, meta, preview = process_audio(audio_bytes)
    
    manifest = upload_to_walrus(
        voice_id=voice_id,
        owner_address=account,
        embedding_bin=embedding,
        config_json=config,
        meta_json=meta,
        preview_wav=preview,
    )
    
    return {
        "walrusUri": manifest["walrusUri"],
        "blobs": manifest["blobs"],
        "previewUrl": get_aggregator_url(
            manifest["blobs"]["preview.wav"]["blobId"]
        ),
    }


@app.post("/api/walrus/download")  # was /api/shelby/download
async def download(body: DownloadRequest):
    manifest_id = parse_walrus_uri(body.uri)
    
    if not verify_access(body.requester_account, body.owner, body.voice_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # No session setup needed — Walrus reads are free
    file_bytes = download_file(manifest_id, body.filename)
    return Response(content=file_bytes, media_type="application/octet-stream")


@app.post("/api/tts/generate")
async def generate_tts(body: TTSRequest):
    manifest_id = parse_walrus_uri(body.model_uri)
    
    if not verify_access(body.requester_account, ...):
        raise HTTPException(status_code=403, detail="Access denied")
    
    embedding = download_file(manifest_id, "embedding.bin")
    config = json.loads(download_file(manifest_id, "config.json"))
    audio = generate_preview(embedding, config, body.text)
    return Response(content=audio, media_type="audio/wav")
```

---

## 4. Frontend Migration

### 4.1 Replace `src/lib/shelby.ts` → `src/lib/walrus.ts`

```typescript
/**
 * walrus.ts — Replaces shelby.ts
 * 
 * Key simplification: No more session management, micropayment channels,
 * or Aptos SDK. Reads are free via the Aggregator HTTP endpoint.
 */

const AGGREGATOR_URL = import.meta.env.VITE_WALRUS_AGGREGATOR_URL
  ?? "https://aggregator.walrus-testnet.walrus.space";

// ── URI helpers ──

export function parseWalrusUri(uri: string): string {
  if (!uri.startsWith("walrus://")) {
    throw new Error(`Invalid Walrus URI: ${uri}`);
  }
  return uri.slice("walrus://".length);
}

export function buildWalrusUri(blobId: string): string {
  return `walrus://${blobId}`;
}

// ── Blob access (replaces ShelbyRPCClient.getBlob + session setup) ──

export function getBlobUrl(blobId: string): string {
  // Direct HTTP URL — works in <audio src>, <img src>, fetch(), etc.
  // No session, no API key, no micropayment needed
  return `${AGGREGATOR_URL}/v1/blobs/${blobId}`;
}

export async function fetchBlob(blobId: string): Promise<ArrayBuffer> {
  const res = await fetch(getBlobUrl(blobId));
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  return res.arrayBuffer();
}

// ── Bundle helpers ──

export interface VoiceManifest {
  voiceId: string;
  owner: string;
  blobs: Record<string, { blobId: string; objectId: string }>;
  walrusUri: string;
}

export async function fetchManifest(manifestBlobId: string): Promise<VoiceManifest> {
  const data = await fetchBlob(manifestBlobId);
  return JSON.parse(new TextDecoder().decode(data));
}

export function getPreviewUrl(manifest: VoiceManifest): string {
  return getBlobUrl(manifest.blobs["preview.wav"].blobId);
}
```

### 4.2 Update `src/pages/Upload.tsx`

```diff
- import { buildShelbyUri, parseShelbyUri } from "../lib/shelby";
- import { ShelbyBlob } from "@shelby-protocol/sdk/browser";
+ import { buildWalrusUri, getPreviewUrl, VoiceManifest } from "../lib/walrus";

  // API call header change:
- headers: { "x-aptos-account": walletAddress }
+ headers: { "x-sui-account": walletAddress }

  // Response handling:
- const { shelbyUri, cid } = response;
- setShelbyUri(shelbyUri);
+ const { walrusUri, blobs, previewUrl } = response;
+ setWalrusUri(walrusUri);

  // Preview audio:
- <audio src={`/api/shelby/download?uri=${shelbyUri}&filename=preview.wav`} />
+ <audio src={previewUrl} />
  // ^ Direct aggregator URL — no backend proxy, no session needed!

  // Voice registration form auto-fill:
- <input value={shelbyUri} name="modelUri" />
+ <input value={walrusUri} name="modelUri" />
```

### 4.3 Clean Up: Remove Shelby/Aptos Dependencies

```bash
npm uninstall @shelby-protocol/sdk @aptos-labs/ts-sdk
```

Delete:
- `src/lib/shelby.ts`
- Any Aptos wallet connection code (if only used for Shelby)
- Session/micropayment management hooks

---

## 5. Sui Move Contract Update

Your existing Sui smart contract stores the Shelby URI. Update the field:

```move
// BEFORE
struct VoiceModel has key, store {
    id: UID,
    owner: address,
    shelby_uri: vector<u8>,    // shelby://0x.../voices/...
    price_per_use: u64,
    usage_rights: u8,
}

// AFTER
struct VoiceModel has key, store {
    id: UID,
    owner: address,
    walrus_uri: vector<u8>,    // walrus://<manifestBlobId>
    price_per_use: u64,
    usage_rights: u8,
}
```

If you want tighter integration, you can also store the Walrus Blob Object ID directly and verify blob availability on-chain — something that was impossible with Shelby's Aptos coordination.

---

## 6. Data Migration Script

```python
"""
migrate_shelby_to_walrus.py

One-time migration of existing Shelby voice bundles to Walrus.
Reads from local dev storage (backend/storage/shelby/) or Shelby RPC.
"""

import os
import json
from backend.walrus import upload_to_walrus

SHELBY_ROOT = "backend/storage/shelby"
migration_map = {}  # {shelby_uri: walrus_uri}

for owner in os.listdir(SHELBY_ROOT):
    voices_dir = os.path.join(SHELBY_ROOT, owner, "voices")
    if not os.path.isdir(voices_dir):
        continue

    for voice_id in os.listdir(voices_dir):
        bundle_dir = os.path.join(voices_dir, voice_id)
        shelby_uri = f"shelby://{owner}/voices/{voice_id}"

        with open(os.path.join(bundle_dir, "embedding.bin"), "rb") as f:
            embedding = f.read()
        with open(os.path.join(bundle_dir, "config.json")) as f:
            config = json.load(f)
        with open(os.path.join(bundle_dir, "meta.json")) as f:
            meta = json.load(f)
        with open(os.path.join(bundle_dir, "preview.wav"), "rb") as f:
            preview = f.read()

        manifest = upload_to_walrus(
            voice_id=voice_id,
            owner_address=owner,
            embedding_bin=embedding,
            config_json=config,
            meta_json=meta,
            preview_wav=preview,
        )

        migration_map[shelby_uri] = manifest["walrusUri"]
        print(f"  {shelby_uri} → {manifest['walrusUri']}")

with open("migration_map.json", "w") as f:
    json.dump(migration_map, f, indent=2)

print(f"\nMigrated {len(migration_map)} voices → migration_map.json")
```

After migration, update on-chain `VoiceModel` objects with the new `walrus_uri` values.

---

## 7. What You're Eliminating

Shelby required several pieces of infrastructure that Walrus doesn't need:

| Shelby Concept | Why it existed | Walrus equivalent |
|---|---|---|
| **Sessions** (`POST /sessions`) | Authentication + billing for reads | Not needed — reads are free |
| **Micropayment channels** | Pay storage providers per-read in shelbyUSD | Not needed — WAL paid upfront at write time |
| **Aptos wallet + SDK** | On-chain blob registration, chunk acknowledgements | Eliminated — Sui handles everything |
| **API keys** | Auth to Shelby RPC | Not needed for public Aggregator reads; Publisher needs funded Sui wallet |
| **`registerBlob()` + `confirmBlobChunks()`** | Two-step on-chain registration on Aptos | Automatic — Publisher does Sui tx during `PUT /v1/blobs` |
| **`shelbyUSD` tokens** | Read payment token | Not needed |
| **Byte-range reads** (`Range` header) | Streaming partial blobs | Not supported at Walrus HTTP level (full blob download) |

---

## 8. Error Handling

| Status | Shelby Meaning | Walrus Meaning | Action |
|---|---|---|---|
| 400 | Invalid blob path | Invalid blob ID format | Validate URI before request |
| 403 | Access denied | — (Walrus reads are public; handle ACL in your backend) | Check Sui contract permissions |
| 404 | Blob not found | Blob expired or never uploaded | Re-upload; check epoch expiry |
| 413 | — | File > 10 MiB (Publisher default limit) | Split files or increase Publisher `--max-body-size` |
| 416 | Invalid byte range | — (no range support) | Download full blob |
| 429 | — | Publisher overloaded | Retry with exponential backoff |

---

## 9. Embedding.bin Size Consideration

Your `embedding.bin` files are 10-50 MB. Walrus Publishers default to a 10 MiB max body size. Two options:

**Option A: Self-host a Publisher with higher limit**
```bash
walrus publisher --bind-address "0.0.0.0:31416" --max-body-size 104857600  # 100 MiB
```

**Option B: Split embedding into chunks**
```python
CHUNK_SIZE = 9 * 1024 * 1024  # 9 MiB (under 10 MiB default)

def upload_large_file(data: bytes, epochs: int) -> list[str]:
    """Split large file into chunks, upload each, return ordered blob IDs."""
    blob_ids = []
    for i in range(0, len(data), CHUNK_SIZE):
        chunk = data[i:i + CHUNK_SIZE]
        resp = client.put_blob(data=chunk, epochs=epochs, deletable=DELETABLE)
        blob_id, _ = _extract_ids(resp)
        blob_ids.append(blob_id)
    return blob_ids

def download_large_file(blob_ids: list[str]) -> bytes:
    """Download and reassemble chunked file."""
    return b"".join(client.get_blob(bid) for bid in blob_ids)
```

Update the manifest to store chunk lists:
```json
{
  "embedding.bin": {
    "chunked": true,
    "blobIds": ["chunk1_id", "chunk2_id", "chunk3_id"]
  }
}
```

---

## 10. Migration Checklist

### Backend
- [ ] `pip install walrus-python`
- [ ] Create `backend/walrus.py` (replacing `backend/shelby.py`)
- [ ] Update `backend/server.py`:
  - [ ] `/api/voice/process` → use `upload_to_walrus()`
  - [ ] `/api/shelby/download` → rename to `/api/walrus/download`, use `download_file()`
  - [ ] `/api/tts/generate` → use `download_file()` with Walrus
  - [ ] Change header from `x-aptos-account` to `x-sui-account`
- [ ] Remove Shelby session/micropayment code
- [ ] Handle embedding.bin size (Option A or B above)

### Frontend
- [ ] Replace `src/lib/shelby.ts` with `src/lib/walrus.ts`
- [ ] Update `Upload.tsx` to use `walrusUri` and direct Aggregator preview URLs
- [ ] `npm uninstall @shelby-protocol/sdk @aptos-labs/ts-sdk`
- [ ] Remove Aptos wallet connection (if only used for Shelby)
- [ ] Remove session management hooks

### Smart Contracts
- [ ] Update Sui Move contract: `shelby_uri` → `walrus_uri` field
- [ ] Consider storing Walrus Blob Object ID for on-chain verification

### Data Migration
- [ ] Run `migrate_shelby_to_walrus.py` for existing voices
- [ ] Update on-chain VoiceModel objects with new URIs
- [ ] Verify all voices are accessible via Aggregator

### Environment
- [ ] Set `WALRUS_PUBLISHER_URL` and `WALRUS_AGGREGATOR_URL`
- [ ] Remove Shelby env vars (`SHELBY_RPC_URL`, `SHELBY_API_KEY`, Aptos vars)
- [ ] Fund Publisher wallet with SUI + WAL tokens
- [ ] Test full flow: upload → register → browse → purchase → TTS
