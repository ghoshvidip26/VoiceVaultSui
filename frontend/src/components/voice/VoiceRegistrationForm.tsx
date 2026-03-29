import { useState, useEffect } from "react";
import { useVoiceRegister } from "@/hooks/useVoiceRegister";
import { useVoiceUnregister } from "@/hooks/useVoiceUnregister";
import { useSuiWallet } from "@/hooks/useSuiWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addVoiceToRegistry, removeVoiceFromRegistry } from "@/lib/voiceRegistry";
import { useVoiceMetadata } from "@/hooks/useVoiceMetadata";
import { fetchManifestFromUri, isWalrusUri } from "@/lib/walrus";

interface VoiceRegistrationFormProps {
  autoName?: string;
  autoModelUri?: string;
}

export function VoiceRegistrationForm({ autoName = "", autoModelUri = "" }: VoiceRegistrationFormProps) {
  const { registerVoice, isRegistering } = useVoiceRegister();
  const { unregisterVoice, isUnregistering } = useVoiceUnregister();
  const { address, isConnected } = useSuiWallet();
  const [formData, setFormData] = useState({
    name: autoName,
    modelUri: autoModelUri,
    rights: "commercial",
    pricePerUse: "0.1",
  });

  // Check if user already has a registered voice (fetched from blockchain)
  const { metadata: existingVoice, isLoading: checkingVoice } = useVoiceMetadata(address || null);

  // Update form when auto-fill values change
  useEffect(() => {
    if (autoName) setFormData(prev => ({ ...prev, name: autoName }));
    if (autoModelUri) setFormData(prev => ({ ...prev, modelUri: autoModelUri }));
  }, [autoName, autoModelUri]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Check if voice already exists (one voice per creator limitation from contract)
    if (existingVoice) {
      toast.error("You already have a registered voice. Only one voice per wallet address is allowed.", {
        description: `Existing voice: ${existingVoice.name}`,
        duration: 5000,
      });
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error("Voice name is required");
      return;
    }

    if (!formData.modelUri.trim()) {
      toast.error("Model URI is required. Please enter a Walrus URI", {
        description: "If you processed your voice model above, the Walrus URI should be auto-filled",
      });
      return;
    }

    if (!isWalrusUri(formData.modelUri.trim())) {
      toast.error("Invalid model URI format", {
        description: "Only Walrus URIs are accepted (format: walrus://<manifest_blob_id>)",
      });
      return;
    }

    let manifestOwner = "";
    try {
      const manifest = await fetchManifestFromUri(formData.modelUri.trim());
      manifestOwner = manifest.owner;
    } catch {
      toast.error("Unable to load Walrus manifest", {
        description: "Check that the URI exists and the Walrus aggregator is reachable",
      });
      return;
    }

    if (manifestOwner && address && manifestOwner.toLowerCase() !== address.toLowerCase()) {
      toast.error("URI owner mismatch", {
        description: "The Walrus manifest owner must match your connected wallet address",
      });
      return;
    }

    const price = parseFloat(formData.pricePerUse);
    if (isNaN(price) || price <= 0) {
      toast.error("Price per use must be greater than 0");
      return;
    }

    if (!formData.rights.trim()) {
      toast.error("Usage rights are required");
      return;
    }

    toast.info("Registering voice on Sui blockchain...");
    const result = await registerVoice({
      name: formData.name.trim(),
      modelUri: formData.modelUri.trim(),
      rights: formData.rights.trim(),
      pricePerUse: price,
    });

    if (result?.success) {
      addVoiceToRegistry(address, formData.name);

      setFormData({
        name: "",
        modelUri: "",
        rights: "commercial",
        pricePerUse: "0.1",
      });

      toast.success("Voice registered on-chain successfully!", {
        description: `Transaction: ${result.transactionHash.slice(0, 8)}...${result.transactionHash.slice(-6)}`,
        duration: 7000,
        action: {
          label: "View on Explorer",
          onClick: () => {
            window.open(`https://suiscan.xyz/testnet/tx/${result.transactionHash}`, '_blank');
          },
        },
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  const handleDelete = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!existingVoice) {
      toast.error("No voice found to delete");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete your voice "${existingVoice.name}"? This action cannot be undone and will remove your voice from the blockchain and storage.`
    );

    if (!confirmed) return;

    toast.info("Deleting voice on Sui blockchain...");
    const result = await unregisterVoice(existingVoice.objectId);

    if (result?.success) {
      removeVoiceFromRegistry(address);

      if (existingVoice.modelUri && (existingVoice.modelUri.startsWith("walrus://") || existingVoice.modelUri.startsWith("walrus://"))) {
        try {
          toast.info("Deleting voice bundle from storage...");
          const { backendApi } = await import("@/lib/api");
          await backendApi.deleteModelBundle(existingVoice.modelUri, address);
          toast.success("Voice deleted from storage");
        } catch (err: any) {
          console.error("Error deleting from storage:", err);
          toast.warning("Voice deleted on-chain, but storage deletion failed", {
            description: err.message || "Voice files may still exist in storage",
          });
        }
      }

      toast.success("Voice deleted successfully!", {
        description: `Transaction: ${result.transactionHash.slice(0, 8)}...${result.transactionHash.slice(-6)}`,
        duration: 7000,
        action: {
          label: "View on Explorer",
          onClick: () => {
            window.open(`https://suiscan.xyz/testnet/tx/${result.transactionHash}`, '_blank');
          },
        },
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  // Show warning if voice already exists
  if (existingVoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voice Already Registered</CardTitle>
          <CardDescription>
            You already have a voice registered on-chain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <strong>Voice Name:</strong> {existingVoice.name}
                </p>
                <p>
                  <strong>Voice ID:</strong> {existingVoice.voiceId}
                </p>
                <p>
                  <strong>Model URI:</strong> {existingVoice.modelUri}
                </p>
                <p>
                  <strong>Price:</strong> {existingVoice.pricePerUse} SUI per use
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  The contract allows only one voice per wallet address. You can delete this voice to register a new one.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isUnregistering || !isConnected}
            className="w-full"
          >
            {isUnregistering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting Voice...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Voice
              </>
            )}
          </Button>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Warning:</strong> Deleting your voice will permanently remove it from the blockchain.
              You will need to sign a transaction with your wallet to confirm the deletion.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Your Voice on-Chain</CardTitle>
        <CardDescription>
          Register your voice model on Sui blockchain to start earning. Only one voice per wallet address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to register a voice on-chain
            </AlertDescription>
          </Alert>
        )}

        {checkingVoice && (
          <Alert className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Checking if you already have a registered voice on-chain...
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Voice Name</Label>
            <Input
              id="name"
              placeholder="e.g., Alex Sterling"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelUri">
              Model URI <span className="text-red-500">*</span>
            </Label>
            <Input
              id="modelUri"
              placeholder=""
              value={formData.modelUri}
              onChange={(e) => setFormData({ ...formData, modelUri: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Required. Enter the Walrus URI for your voice model. If you processed your voice above, this should be auto-filled.
              <br />
              Format: <code className="text-xs">walrus://&lt;manifest_blob_id&gt;</code>
              <br />
              Only Walrus URIs are accepted. Process your voice model in Step 1 to get a Walrus URI.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rights">
              Usage Rights <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rights"
              placeholder="e.g., commercial, personal, limited"
              value={formData.rights}
              onChange={(e) => setFormData({ ...formData, rights: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Specify the usage rights for your voice (e.g., "commercial", "personal", "limited")
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">
              Price Per Use (SUI) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              step="0.0001"
              min="0.0001"
              placeholder="0.1"
              value={formData.pricePerUse}
              onChange={(e) => setFormData({ ...formData, pricePerUse: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Set the price per use in SUI. Must be greater than 0.
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Important:</strong> This will register your voice on Sui blockchain.
              Only one voice per wallet address is allowed. You will need to sign a transaction with your wallet.
            </AlertDescription>
          </Alert>

          <Button
            type="submit"
            disabled={isRegistering || !isConnected || checkingVoice}
            className="w-full"
          >
            {isRegistering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering on Blockchain...
              </>
            ) : checkingVoice ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : !isConnected ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Connect Wallet First
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Register Voice on Blockchain
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
