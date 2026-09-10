import { useEffect, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { normalizePath, siteUrl } from "@/lib/site-url";
import { track } from "@/lib/analytics";

type ShareRowProps = {
  title: string;
  /** Path of the page being shared, e.g. "/product/signature-pistachio-baklawa". */
  path: string;
  className?: string;
};

/** Lightweight share row — plain links, no third-party scripts or trackers. */
export function ShareRow({ title, path, className }: ShareRowProps) {
  const [copied, setCopied] = useState(false);
  // Server render has no browser origin, so start with the configured/relative
  // value and upgrade to the absolute URL after mount (no hydration mismatch).
  const [shareUrl, setShareUrl] = useState(() => normalizePath(path));
  useEffect(() => setShareUrl(siteUrl(path)), [path]);
  const absoluteUrl = () => shareUrl;

  const targets = [
    {
      label: "WhatsApp",
      build: (u: string) => `https://wa.me/?text=${encodeURIComponent(`${title} ${u}`)}`,
    },
    {
      label: "Facebook",
      build: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    },
    {
      label: "X",
      build: (u: string) =>
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(title)}`,
    },
    {
      label: "Pinterest",
      build: (u: string) =>
        `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(u)}&description=${encodeURIComponent(title)}`,
    },
    {
      label: "Email",
      build: (u: string) =>
        `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(u)}`,
    },
  ];

  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function nativeShare() {
    try {
      await navigator.share({ title, url: absoluteUrl() });
      track({ name: "share", params: { channel: "native", path } });
    } catch {
      /* dismissed or unsupported — the explicit links remain available */
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrl());
      setCopied(true);
      track({ name: "share", params: { channel: "copy_link", path } });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      <span className="text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">Share</span>
      {canNativeShare ? (
        <button
          type="button"
          onClick={() => void nativeShare()}
          className="flex min-h-11 items-center gap-1.5 text-[0.8125rem] text-muted-foreground hover:text-foreground"
        >
          <Share2 className="size-3.5" />
          Share
        </button>
      ) : null}
      {targets.map((target) => (
        <a
          key={target.label}
          href={target.build(absoluteUrl())}
          onClick={() => track({ name: "share", params: { channel: target.label, path } })}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="link-underline flex min-h-11 items-center text-[0.8125rem] text-muted-foreground hover:text-foreground"
        >
          {target.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="flex min-h-11 items-center gap-1.5 text-[0.8125rem] text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="size-3.5 text-olive" /> : <Link2 className="size-3.5" />}
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
