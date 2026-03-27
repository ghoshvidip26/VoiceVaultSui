module VoiceVault::voice_identity {
    use std::signer;
    use std::string;
    use aptos_framework::timestamp;

    /// Error codes
    const ERROR_VOICE_ALREADY_EXISTS: u64 = 1;
    const ERROR_VOICE_NOT_FOUND: u64 = 2;
    const ERROR_UNAUTHORIZED: u64 = 3;

    struct VoiceIdentity has key {
        owner: address,
        voice_id: u64,
        name: string::String,
        model_uri: string::String,
        rights: string::String,
        price_per_use: u64,
        created_at: u64,
    }

    struct VoiceRegistry has key {
        counter: u64,
    }

    /// Initialize registry
    public entry fun init_registry(creator: &signer) {
        let creator_addr = signer::address_of(creator);

        if (!exists<VoiceRegistry>(creator_addr)) {
            move_to(creator, VoiceRegistry { counter: 0 });
        };
    }

    /// Register a new voice (one per creator)
    public entry fun register_voice(
        creator: &signer,
        name: string::String,
        model_uri: string::String,
        rights: string::String,
        price_per_use: u64
    ) acquires VoiceRegistry {
        let creator_addr = signer::address_of(creator);

        // Only one voice per creator
        assert!(
            !exists<VoiceIdentity>(creator_addr),
            ERROR_VOICE_ALREADY_EXISTS
        );

        // Auto-init registry
        if (!exists<VoiceRegistry>(creator_addr)) {
            move_to(creator, VoiceRegistry { counter: 0 });
        };

        let registry = borrow_global_mut<VoiceRegistry>(creator_addr);
        let new_id = registry.counter;
        registry.counter = new_id + 1;

        move_to(
            creator,
            VoiceIdentity {
                owner: creator_addr,
                voice_id: new_id,
                name,
                model_uri,
                rights,
                price_per_use,
                created_at: timestamp::now_seconds(),
            }
        );
    }

    /// Get voice ID
    public fun get_voice_id(owner: address): u64 acquires VoiceIdentity {
        assert!(exists<VoiceIdentity>(owner), ERROR_VOICE_NOT_FOUND);
        borrow_global<VoiceIdentity>(owner).voice_id
    }

    /// Get full metadata
    public fun get_metadata(
        owner: address
    ): (
        address,
        u64,
        string::String,
        string::String,
        string::String,
        u64,
        u64
    ) acquires VoiceIdentity {
        assert!(exists<VoiceIdentity>(owner), ERROR_VOICE_NOT_FOUND);
        let voice = borrow_global<VoiceIdentity>(owner);

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

    /// Check existence
    public fun voice_exists(owner: address): bool {
        exists<VoiceIdentity>(owner)
    }

    /// Registry counter (debug)
    public fun get_registry_counter(owner: address): u64 acquires VoiceRegistry {
        if (exists<VoiceRegistry>(owner)) {
            borrow_global<VoiceRegistry>(owner).counter
        } else {
            0
        }
    }

    /// Unregister/delete a voice (only owner can delete their own voice)
    public entry fun unregister_voice(creator: &signer) acquires VoiceIdentity {
        let creator_addr = signer::address_of(creator);

        // Verify voice exists
        assert!(
            exists<VoiceIdentity>(creator_addr),
            ERROR_VOICE_NOT_FOUND
        );

        // Verify the signer is the owner of the voice
        let voice = borrow_global<VoiceIdentity>(creator_addr);
        assert!(
            voice.owner == creator_addr,
            ERROR_UNAUTHORIZED
        );

        // Destroy the VoiceIdentity resource
        let VoiceIdentity {
            owner: _,
            voice_id: _,
            name: _,
            model_uri: _,
            rights: _,
            price_per_use: _,
            created_at: _,
        } = move_from<VoiceIdentity>(creator_addr);
    }
}
