module voice_vault_sui::voice_identity {
    use std::string::String;
    /// Voice object
    public struct VoiceIdentity has key, store {
        id: UID,
        owner: address,
        name: String,
        model_uri: String, // Stores the Walrus manifest URI (walrus://<manifest_blob_id>)
        rights: String,
        price_per_use: u64,
        created_at: u64
    }

    /// Register voice (ONE per user enforced externally)
    public fun register_voice(
        name: String,
        model_uri: String,
        rights: String,
        price_per_use: u64,
        ctx: &mut TxContext
    ): VoiceIdentity {
        let sender = tx_context::sender(ctx);

        VoiceIdentity {
            id: object::new(ctx),
            owner: sender,
            name,
            model_uri,
            rights,
            price_per_use,
            created_at: 0
        }
    }

    /// Delete voice
    public fun delete_voice(voice: VoiceIdentity, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        assert!(voice.owner == sender, 0);

        let VoiceIdentity { id,.. } = voice;
        object::delete(id);
    }

    /// Read helpers
    public fun get_metadata(voice: &VoiceIdentity):
        (address, String, String, String, u64, u64) {
        (
            voice.owner,
            voice.name,
            voice.model_uri,
            voice.rights,
            voice.price_per_use,
            voice.created_at
        )
    }

    public fun get_voice_id(voice: &VoiceIdentity): ID {
        object::id(voice)
    }
}

