module VoiceVault::payment_contract {
    use std::signer;

    use aptos_framework::account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// Error codes
    const ERROR_INVALID_AMOUNT: u64 = 3;
    const ERROR_INVALID_ADDRESS: u64 = 4;

    /// Stores all payment-related events under the payer
    struct PaymentEvents has key {
        payment_received: event::EventHandle<PaymentReceived>,
        royalty_paid: event::EventHandle<RoyaltyPaid>,
        platform_fee_paid: event::EventHandle<PlatformFeePaid>,
    }

    struct PaymentReceived has drop, store {
        from: address,
        to: address,
        amount: u64,
        timestamp: u64,
    }

    struct RoyaltyPaid has drop, store {
        payer: address,
        royalty_recipient: address,
        amount: u64,
        timestamp: u64,
    }

    struct PlatformFeePaid has drop, store {
        payer: address,
        platform: address,
        amount: u64,
        timestamp: u64,
    }

    /// Initialize event handles for an account
    public entry fun init(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        if (!exists<PaymentEvents>(admin_addr)) {
            move_to(
                admin,
                PaymentEvents {
                    payment_received: account::new_event_handle<PaymentReceived>(admin),
                    royalty_paid: account::new_event_handle<RoyaltyPaid>(admin),
                    platform_fee_paid: account::new_event_handle<PlatformFeePaid>(admin),
                }
            );
        };
    }

    /// Check if PaymentEvents exists for an address
    public fun is_initialized(addr: address): bool {
        exists<PaymentEvents>(addr)
    }

    /// Payment with platform fee + royalty split
    public entry fun pay_with_royalty_split(
        payer: &signer,
        creator: address,
        platform: address,
        royalty_recipient: address,
        amount: u64
    ) acquires PaymentEvents {
        let payer_addr = signer::address_of(payer);

        // Validate inputs
        assert!(amount > 0, ERROR_INVALID_AMOUNT);
        assert!(creator != @0x0, ERROR_INVALID_ADDRESS);
        assert!(platform != @0x0, ERROR_INVALID_ADDRESS);
        assert!(royalty_recipient != @0x0, ERROR_INVALID_ADDRESS);

        // Auto-init events
        if (!exists<PaymentEvents>(payer_addr)) {
            init(payer);
        };

        let timestamp = timestamp::now_seconds();

        // Withdraw full amount
        let coins = coin::withdraw<AptosCoin>(payer, amount);

        // Platform fee: 2.5%
        let platform_fee = amount * 250 / 10_000;
        let remaining_after_platform = amount - platform_fee;

        // Royalty: 10%
        let royalty_amount = remaining_after_platform * 1000 / 10_000;
        let creator_amount = remaining_after_platform - royalty_amount;

        // Pay platform
        let platform_coin = coin::extract(&mut coins, platform_fee);
        coin::deposit(platform, platform_coin);

        // Pay royalty recipient
        let royalty_coin = coin::extract(&mut coins, royalty_amount);
        coin::deposit(royalty_recipient, royalty_coin);

        // Pay creator
        coin::deposit(creator, coins);

        // Emit events
        let events = borrow_global_mut<PaymentEvents>(payer_addr);

        event::emit_event(
            &mut events.platform_fee_paid,
            PlatformFeePaid {
                payer: payer_addr,
                platform,
                amount: platform_fee,
                timestamp,
            }
        );

        event::emit_event(
            &mut events.royalty_paid,
            RoyaltyPaid {
                payer: payer_addr,
                royalty_recipient,
                amount: royalty_amount,
                timestamp,
            }
        );

        event::emit_event(
            &mut events.payment_received,
            PaymentReceived {
                from: payer_addr,
                to: creator,
                amount: creator_amount,
                timestamp,
            }
        );
    }

    /// Full payment to creator (no fees, no royalties)
    public entry fun pay_full_to_creator(
        payer: &signer,
        creator: address,
        amount: u64
    ) acquires PaymentEvents {
        let payer_addr = signer::address_of(payer);

        // Validate inputs
        assert!(amount > 0, ERROR_INVALID_AMOUNT);
        assert!(creator != @0x0, ERROR_INVALID_ADDRESS);

        // Auto-init events
        if (!exists<PaymentEvents>(payer_addr)) {
            init(payer);
        };

        let timestamp = timestamp::now_seconds();

        // Transfer full amount
        let coins = coin::withdraw<AptosCoin>(payer, amount);
        coin::deposit(creator, coins);

        // Emit event
        let events = borrow_global_mut<PaymentEvents>(payer_addr);
        event::emit_event(
            &mut events.payment_received,
            PaymentReceived {
                from: payer_addr,
                to: creator,
                amount,
                timestamp,
            }
        );
    }

    /// View helper: returns (platform_fee, royalty, creator_amount)
    public fun calculate_payment_breakdown(amount: u64): (u64, u64, u64) {
        let platform_fee = amount * 250 / 10_000;
        let remaining_after_platform = amount - platform_fee;
        let royalty_amount = remaining_after_platform * 1000 / 10_000;
        let creator_amount = remaining_after_platform - royalty_amount;
        (platform_fee, royalty_amount, creator_amount)
    }
}
