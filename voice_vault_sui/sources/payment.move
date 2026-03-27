module voice_vault_sui::payment {

    use sui::coin::{Self, Coin};
    use sui::tx_context::TxContext;
    use sui::event;

    const PLATFORM_FEE_BPS: u64 = 250;
    const ROYALTY_BPS: u64 = 1000;
    const DENOM: u64 = 10000;

    /// Events (replacement for Aptos EventHandle)
    public struct PaymentReceived has copy, drop {
        from: address,
        to: address,
        amount: u64
    }

    public struct RoyaltyPaid has copy, drop {
        payer: address,
        recipient: address,
        amount: u64
    }

    public struct PlatformFeePaid has copy, drop {
        payer: address,
        platform: address,
        amount: u64
    }

    public fun pay_with_royalty_split<T>(
        mut payment: Coin<T>,
        creator: address,
        platform: address,
        royalty_recipient: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let total = coin::value(&payment);

        assert!(total > 0, 0);

        let platform_fee = total * PLATFORM_FEE_BPS / DENOM;
        let remaining = total - platform_fee;
        let royalty = remaining * ROYALTY_BPS / DENOM;

        let platform_coin = coin::split(&mut payment, platform_fee, ctx);
        let royalty_coin = coin::split(&mut payment, royalty, ctx);

        transfer::public_transfer(platform_coin, platform);
        transfer::public_transfer(royalty_coin, royalty_recipient);
        transfer::public_transfer(payment, creator);

        /// Emit events
        event::emit(PlatformFeePaid {
            payer: sender,
            platform,
            amount: platform_fee
        });

        event::emit(RoyaltyPaid {
            payer: sender,
            recipient: royalty_recipient,
            amount: royalty
        });

        event::emit(PaymentReceived {
            from: sender,
            to: creator,
            amount: total - platform_fee - royalty
        });
    }

    public fun pay_full_to_creator<T>(
        payment: Coin<T>,
        creator: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let amount = coin::value(&payment);

        transfer::public_transfer(payment, creator);

        event::emit(PaymentReceived {
            from: sender,
            to: creator,
            amount
        });
    }

    public fun calculate_payment_breakdown(
        amount: u64
    ): (u64, u64, u64) {
        let platform_fee = amount * PLATFORM_FEE_BPS / DENOM;
        let remaining = amount - platform_fee;
        let royalty = remaining * ROYALTY_BPS / DENOM;
        let creator_amount = remaining - royalty;

        (platform_fee, royalty, creator_amount)
    }
}