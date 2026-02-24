import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Lock, Sparkles } from 'lucide-react';

export const metadata: Metadata = { title: 'Sign In' };

export default function LoginPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#060913] text-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute right-[-8%] top-[10%] h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
                <div className="absolute bottom-[-10%] left-[20%] h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]" />
            </div>

            <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                        <Sparkles className="h-3.5 w-3.5" /> Realm Listings Workspace
                    </div>
                    <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                        Sign in to manage listings, leads, and performance.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base text-white/65">
                        Access the `/dashboard/*` operations workspace while keeping the public portal and listing pages in sync.
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {[
                            'Listing operations and publishing',
                            'Inquiry routing and SLA tracking',
                            'Tour scheduling workflows',
                            'Performance analytics and signals',
                        ].map((item) => (
                            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                                {item}
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 text-sm text-white/60">
                        Looking to browse homes instead? <Link href="/listings" className="text-cyan-200 hover:text-cyan-100">Return to listings</Link>.
                    </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <Lock className="h-6 w-6 text-cyan-200" />
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-white">Team sign in</h2>
                    <p className="mt-2 text-sm text-white/60">Use your organization identity provider to access the workspace.</p>

                    <form className="mt-6 space-y-4">
                        <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Work email</span>
                            <input type="email" placeholder="you@brokerage.com" className={inputClass} />
                        </label>
                        <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Organization</span>
                            <input type="text" placeholder="Realm Realty" className={inputClass} />
                        </label>
                        <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
                            Continue with SSO <ArrowRight className="h-4 w-4" />
                        </button>
                        <button type="button" className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10">
                            Continue with organization account
                        </button>
                    </form>

                    <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
                        Prototype login screen. Hook this route into your auth provider and session middleware next.
                    </div>
                    <div className="mt-4 text-center text-sm text-white/60">
                        <Link href="https://realtyos.com" className="hover:text-white">← Back to RealtyOS</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

const inputClass =
    'w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/35';
