import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Helmet } from "react-helmet-async";
import {
  Mic,
  Upload,
  ShoppingCart,
  Wallet,
  ArrowRight,
  Coins,
  Shield,
  Layers,
  BookOpen,
  Zap,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CONTRACTS, FEE_STRUCTURE } from "@/lib/contracts";

const Docs = () => {
  return (
    <>
      <Helmet>
        <title>Documentation - VoiceVault</title>
        <meta
          name="description"
          content="Learn how to use VoiceVault — create voice models, register on-chain, trade in the marketplace, and earn from every use."
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Hero */}
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Documentation
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                How to Use{" "}
                <span className="gradient-text">VoiceVault</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create, own, and monetize AI voice models
                on the Sui blockchain.
              </p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
              {[
                { label: "Getting Started", href: "#getting-started", icon: Zap },
                { label: "Create Voice", href: "#create-voice", icon: Mic },
                { label: "Marketplace", href: "#marketplace", icon: ShoppingCart },
                { label: "FAQ", href: "#faq", icon: HelpCircle },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-medium"
                >
                  <link.icon className="h-4 w-4 text-primary shrink-0" />
                  {link.label}
                </a>
              ))}
            </div>

            {/* Getting Started */}
            <Section id="getting-started" icon={Zap} title="Getting Started">
              <Step number={1} title="Install a Sui Wallet">
                <p>
                  You need a Sui-compatible wallet to use VoiceVault. We
                  recommend{" "}
                  <strong>Sui Wallet</strong>,{" "}
                  <strong>Suiet</strong>, or{" "}
                  <strong>Ethos Wallet</strong>. Install one as a browser
                  extension, then create or import an account.
                </p>
              </Step>

              <Step number={2} title="Get SUI Tokens">
                <p>
                  You'll need SUI tokens for transaction fees and voice
                  purchases. On <strong>testnet</strong>, request free tokens
                  from the{" "}
                  <a
                    href="https://faucet.sui.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Sui Faucet
                  </a>
                  . On mainnet, acquire SUI from an exchange.
                </p>
              </Step>

              <Step number={3} title="Connect Your Wallet">
                <p>
                  Click the <strong>Connect</strong> button in the top-right
                  corner of VoiceVault. Approve the connection in your wallet
                  popup. Once connected, you'll see your address and SUI balance
                  in the navbar.
                </p>
              </Step>
            </Section>

            {/* Create Voice */}
            <Section id="create-voice" icon={Mic} title="Creating a Voice">
              <Step number={1} title="Upload Audio">
                <p>
                  Navigate to{" "}
                  <Link to="/upload" className="text-primary hover:underline">
                    Create Voice
                  </Link>{" "}
                  and upload a clear audio recording of your voice. For best
                  results, use 10–30 seconds of clean speech in a quiet
                  environment. Supported formats: WAV, MP3.
                </p>
              </Step>

              <Step number={2} title="Process &amp; Train">
                <p>
                  Click <strong>Process Voice</strong>. VoiceVault sends your
                  audio to the voice processing pipeline, which generates a voice
                  embedding and bundles it with metadata. Once done, your voice
                  model is uploaded to Walrus decentralized storage and you'll
                  receive a <code>walrus://</code> URI.
                </p>
              </Step>

              <Step number={3} title="Register On-Chain">
                <p>
                  Fill in the registration form — voice name, model URI (auto-filled),
                  usage rights, and price per use in SUI. Click{" "}
                  <strong>Register Voice on Blockchain</strong> and approve the
                  transaction in your wallet. Your voice is now a Sui object owned by
                  your address.
                </p>
                <InfoBox>
                  The contract currently allows <strong>one voice per wallet</strong>.
                  To register a different voice, delete the existing one first.
                </InfoBox>
              </Step>
            </Section>

            {/* Marketplace */}
            <Section
              id="marketplace"
              icon={ShoppingCart}
              title="Using the Marketplace"
            >
              <Step number={1} title="Browse Voices">
                <p>
                  Visit the{" "}
                  <Link
                    to="/marketplace"
                    className="text-primary hover:underline"
                  >
                    Marketplace
                  </Link>{" "}
                  to explore registered voices. Each card shows the voice name,
                  creator address, price per use, and a preview player (when
                  available). Use the search bar to filter by name or creator.
                </p>
              </Step>

              <Step number={2} title="Purchase &amp; Generate">
                <p>
                  Click <strong>Purchase</strong> on a voice card. A dialog shows
                  the payment breakdown before you confirm. Once the transaction
                  completes, the voice is added to your purchased list and you can
                  use it for TTS generation on the{" "}
                  <Link to="/upload" className="text-primary hover:underline">
                    Create Voice
                  </Link>{" "}
                  page.
                </p>
              </Step>

              <Step number={3} title="Payment Breakdown">
                <p>Every payment is split automatically by the on-chain contract:</p>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <StatBox
                    label="Platform Fee"
                    value={`${FEE_STRUCTURE.PLATFORM_FEE_BPS / 100}%`}
                  />
                  <StatBox
                    label="Royalty"
                    value={`${FEE_STRUCTURE.ROYALTY_BPS / 100}%`}
                  />
                  <StatBox label="Creator" value="87.75%" />
                </div>
              </Step>
            </Section>

            {/* Dashboard */}
            <Section id="dashboard" icon={Layers} title="Creator Dashboard">
              <p className="text-muted-foreground mb-4">
                Your{" "}
                <Link to="/dashboard" className="text-primary hover:underline">
                  Dashboard
                </Link>{" "}
                displays:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary mt-1 shrink-0" />
                  <span>
                    <strong className="text-foreground">Wallet info</strong> — address, SUI
                    balance, and network.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary mt-1 shrink-0" />
                  <span>
                    <strong className="text-foreground">Voice models</strong> — all voices you've
                    registered on-chain with their price, status, and usage count.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary mt-1 shrink-0" />
                  <span>
                    <strong className="text-foreground">Earnings</strong> — total SUI earned from
                    voice licensing (tracked via on-chain events).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-primary mt-1 shrink-0" />
                  <span>
                    <strong className="text-foreground">Usage chart</strong> — visual breakdown of
                    voice usage over time.
                  </span>
                </li>
              </ul>
            </Section>

            {/* Architecture */}
            <Section id="architecture" icon={Shield} title="How It Works">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  VoiceVault combines three layers to deliver a fully
                  decentralized voice marketplace:
                </p>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Sui Blockchain
                    </h4>
                    <p className="text-sm">
                      Move smart contracts handle voice registration
                      (VoiceIdentity objects), payment splitting, and ownership
                      verification. All on-chain, trustless.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Walrus Storage
                    </h4>
                    <p className="text-sm">
                      Voice embeddings, config, and preview audio are stored in
                      Walrus decentralized blob storage. The on-chain object
                      holds a <code>walrus://</code> URI pointing to the data.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      AI Backend
                    </h4>
                    <p className="text-sm">
                      A Python FastAPI server handles voice model training (via
                      the voice pipeline, TTS generation, and file processing. It never
                      holds keys — all payments go through the wallet.
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            {/* Smart Contracts */}
            <Section id="contracts" icon={Coins} title="Smart Contracts">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Two Move modules are deployed on Sui testnet under package:
                </p>
                <code className="block p-3 rounded-lg bg-muted/50 text-xs font-mono break-all">
                  {CONTRACTS.PACKAGE_ID}
                </code>

                <div className="space-y-3 mt-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                    <h4 className="font-semibold text-foreground mb-1">
                      voice_identity
                    </h4>
                    <p className="text-sm">
                      Manages <code>VoiceRegistry</code> (shared counter) and{" "}
                      <code>VoiceIdentity</code> objects (owned by creators).
                      Functions: <code>register_voice</code>,{" "}
                      <code>delete_voice</code>, <code>get_metadata</code>.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                    <h4 className="font-semibold text-foreground mb-1">
                      payment
                    </h4>
                    <p className="text-sm">
                      Splits payments atomically:{" "}
                      <code>pay_with_royalty_split</code> (2.5% platform + 10%
                      royalty + rest to creator) and{" "}
                      <code>pay_full_to_creator</code>. Emits{" "}
                      <code>PaymentReceived</code>, <code>RoyaltyPaid</code>,
                      and <code>PlatformFeePaid</code> events.
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            {/* FAQ */}
            <Section id="faq" icon={HelpCircle} title="FAQ">
              <div className="space-y-6">
                <FAQ question="What wallets are supported?">
                  Any Sui-compatible wallet works — Sui Wallet, Suiet, Ethos, and
                  others that implement the Sui wallet standard.
                </FAQ>
                <FAQ question="How much does it cost to register a voice?">
                  Registration only costs a small Sui gas fee (typically &lt;0.01
                  SUI). The price you set is what others pay to use your voice.
                </FAQ>
                <FAQ question="Can I register more than one voice?">
                  Currently the contract enforces one voice per wallet address. You
                  can delete your existing voice and register a new one, or use a
                  different wallet.
                </FAQ>
                <FAQ question="What audio formats are supported?">
                  WAV and MP3. For best quality, use a WAV file recorded at 44.1 kHz
                  or higher with minimal background noise.
                </FAQ>
                <FAQ question="How do payments work?">
                  When someone purchases your voice, the payment is split on-chain
                  by the Move contract: 2.5% platform fee, 10% royalty, and the
                  remainder goes directly to your wallet. No intermediaries.
                </FAQ>
                <FAQ question="Is my voice data stored on-chain?">
                  No. The voice embedding and audio are stored on Walrus
                  decentralized storage. Only metadata (name, URI, price, rights)
                  lives on-chain as a Sui object.
                </FAQ>
                <FAQ question="Which network is VoiceVault on?">
                  Currently deployed on <strong>Sui Testnet</strong>. Mainnet
                  deployment is planned.
                </FAQ>
              </div>
            </Section>

            {/* CTA */}
            <div className="mt-16 text-center">
              <p className="text-muted-foreground mb-4">
                Ready to get started?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/upload">
                  <Button size="lg">
                    Create Your Voice
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button variant="outline" size="lg">
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

/* ──────────────── Sub-components ──────────────── */

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-32">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold">{title}</h2>
      </div>
      <div className="pl-0 md:pl-12">{children}</div>
    </section>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
          {number}
        </span>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <div className="pl-10 text-muted-foreground">{children}</div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
      {children}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-background/50 border border-border/50 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-primary text-lg">{value}</p>
    </div>
  );
}

function FAQ({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
      <h4 className="font-semibold mb-2">{question}</h4>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

export default Docs;
