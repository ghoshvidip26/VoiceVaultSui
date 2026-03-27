module voice_vault_sui::voice_identity {

    use std::string::String;

    /// Global registry (shared object)
    public struct VoiceRegistry has key {
        id: UID,
        counter: u64
    }

    /// Voice object
    public struct VoiceIdentity has key, store {
        id: UID,
        owner: address,
        voice_id: u64,
        name: String,
        model_uri: String,
        rights: String,
        price_per_use: u64,
        created_at: u64
    }

    /// Initialize registry (run once)
    public fun init_registry(ctx: &mut TxContext): VoiceRegistry {
        VoiceRegistry { id: object::new(ctx), counter: 0 }
    }

    /// Register voice (ONE per user enforced externally)
    public fun register_voice(
        registry: &mut VoiceRegistry,
        name: String,
        model_uri: String,
        rights: String,
        price_per_use: u64,
        ctx: &mut TxContext
    ): VoiceIdentity {
        let sender = tx_context::sender(ctx);

        let id = registry.counter;
        registry.counter = id + 1;

        VoiceIdentity {
            id: object::new(ctx),
            owner: sender,
            voice_id: id,
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
    public fun get_metadata(voice: &VoiceIdentity): (
        address, u64, String, String, String, u64, u64
    ) {
        (
            voice.owner,
            voice.voice_id,
            voice.name,
            voice.model_uri,
            voice.rights,
            voice.price_per_use,
            voice.created_at
        )
    }

    public fun get_voice_id(voice: &VoiceIdentity): u64 {
        voice.voice_id
    }

    public fun voice_exists(_owner: address): bool {
        // Not enforceable on-chain without registry mapping
        true
    }
}

