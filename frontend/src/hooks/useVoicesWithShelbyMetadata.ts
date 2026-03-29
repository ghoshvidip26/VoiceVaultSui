/**
 * Hook to fetch voices with metadata from both Sui (on-chain) and Shelby (meta.json)
 *
 * Architecture:
 * - Sui stores: owner, modelUri, price, rights, voiceId (on-chain objects)
 * - Shelby stores: name, description, preview.wav (meta.json)
 *
 * This hook fetches on-chain data first, then enriches with Shelby metadata
 */

import { useState, useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { CONTRACTS, mistToSui } from "@/lib/contracts";
import { VoiceMetadata } from "./useVoiceMetadata";
import { isShelbyUri } from "@/lib/shelby";
import { parseMoveString } from "@/lib/moveUtils";

const VOICE_TYPE = `${CONTRACTS.PACKAGE_ID}::${CONTRACTS.VOICE_IDENTITY.module}::VoiceIdentity`;

export interface VoiceWithShelbyMetadata extends VoiceMetadata {
  description?: string;
  previewAudioUrl?: string;
}

export function useVoicesWithShelbyMetadata(addresses: string[]) {
  const suiClient = useSuiClient();
  const [voices, setVoices] = useState<VoiceWithShelbyMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!addresses || addresses.length === 0) {
      setVoices([]);
      setIsLoading(false);
      return;
    }

    const fetchAllVoices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Fetch on-chain metadata from Sui
        const onChainPromises = addresses.map(async (address) => {
          try {
            const result = await suiClient.getOwnedObjects({
              owner: address,
              filter: { StructType: VOICE_TYPE },
              options: { showContent: true },
            });

            if (!result.data || result.data.length === 0) return null;

            const obj = result.data[0];
            const content = obj.data?.content;
            if (!content || content.dataType !== "moveObject") return null;

            const fields = content.fields as any;
            return {
              owner: fields.owner as string,
              voiceId: fields.voice_id?.toString() || "0",
              objectId: obj.data!.objectId,
              name: parseMoveString(fields.name),
              modelUri: parseMoveString(fields.model_uri),
              rights: parseMoveString(fields.rights),
              pricePerUse: mistToSui(Number(fields.price_per_use || 0)),
              createdAt: Number(fields.created_at || 0),
            } as VoiceMetadata;
          } catch (err) {
            console.warn(`Failed to fetch on-chain metadata for ${address}:`, err);
            return null;
          }
        });

        const onChainResults = await Promise.all(onChainPromises);
        const validOnChainVoices = onChainResults.filter((v): v is VoiceMetadata => v !== null);

        // Step 2: Enrich with Shelby metadata (meta.json)
        const enrichedPromises = validOnChainVoices.map(async (voice) => {
          if (!isShelbyUri(voice.modelUri)) {
            return voice as VoiceWithShelbyMetadata;
          }

          try {
            const { backendApi } = await import("@/lib/api");

            const metaBuffer = await backendApi.downloadFromShelby(voice.modelUri, "meta.json");
            const metaText = new TextDecoder().decode(metaBuffer);
            const shelbyMeta = JSON.parse(metaText);

            let previewAudioUrl: string | undefined;
            try {
              const previewBuffer = await backendApi.downloadFromShelby(voice.modelUri, "preview.wav");
              if (previewBuffer) {
                const previewBlob = new Blob([previewBuffer], { type: "audio/wav" });
                previewAudioUrl = URL.createObjectURL(previewBlob);
              }
            } catch {
              console.debug(`Preview not available for ${voice.modelUri}`);
            }

            return {
              ...voice,
              name: shelbyMeta.name || voice.name,
              description: shelbyMeta.description,
              previewAudioUrl,
            } as VoiceWithShelbyMetadata;
          } catch (err) {
            console.warn(`Failed to fetch Shelby metadata for ${voice.modelUri}:`, err);
            return voice as VoiceWithShelbyMetadata;
          }
        });

        const enrichedVoices = await Promise.all(enrichedPromises);
        setVoices(enrichedVoices);
      } catch (err: any) {
        console.error("Error fetching voices with Shelby metadata:", err);
        setError(err.message || "Failed to fetch voices");
        setVoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllVoices();
  }, [addresses.join(","), suiClient]);

  return { voices, isLoading, error };
}
