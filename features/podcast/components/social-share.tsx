'use client';

import { Check, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';

type SocialShareProps = { title: string; text?: string };

export function SocialShare({ title, text }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = typeof window === 'undefined' ? '' : encodeURIComponent(window.location.href);
  const encodedText = encodeURIComponent(text ?? title);
  const links = [
    { href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: Share2, label: 'Facebook' },
    { href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, icon: Share2, label: 'LinkedIn' },
    { href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`, icon: Share2, label: 'WhatsApp' },
  ];

  async function copyLink() {
    await navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function nativeShare() {
    if (navigator.share) await navigator.share({ text, title, url: window.location.href });
    else await copyLink();
  }

  return <div className="flex flex-wrap items-center gap-2" aria-label="Share this podcast">
    <button type="button" onClick={() => void nativeShare()} className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold"><Share2 className="h-3.5 w-3.5" /> Share</button>
    {links.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`Share on ${label}`} className="border-divider dark:border-divider-dark text-muted hover:text-foreground inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"><Icon className="h-3.5 w-3.5" /> {label}</a>)}
    <button type="button" onClick={() => void copyLink()} aria-label="Copy podcast link" className="border-divider dark:border-divider-dark text-muted hover:text-foreground inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy link'}</button>
  </div>;
}
