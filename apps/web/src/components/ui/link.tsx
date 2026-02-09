"use client";

import type { ComponentProps } from "react";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

/**
 * Custom Link component with performance optimizations inspired by NextFaster:
 *
 * 1. IntersectionObserver-based prefetch: Routes are prefetched when the link
 *    enters the viewport and stays visible for 300ms (debounced to avoid wasting
 *    bandwidth during fast scrolling).
 *
 * 2. Mouse hover prefetch: Calls router.prefetch() on hover for freshness.
 *
 * 3. mouseDown navigation: Navigation begins on mouseDown instead of click
 *    (click = mouseDown + mouseUp), saving ~100-200ms per navigation. Only
 *    triggers for same-origin, left-click, no modifier keys (so ctrl+click
 *    for new tab still works).
 */
export const Link = ({
  children,
  prefetch,
  onMouseEnter,
  onMouseDown,
  ...props
}: ComponentProps<typeof NextLink>) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  const hrefString = useMemo(() => String(props.href), [props.href]);
  const isHashOnly = hrefString.startsWith("#");

  useEffect(() => {
    if (prefetch === false || isHashOnly) return;

    const linkElement = linkRef.current;
    if (!linkElement) return;

    let prefetchTimeout: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          prefetchTimeout = setTimeout(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- typed routes generate RouteImpl at build time
            router.prefetch(hrefString as any);
            observer.unobserve(entry.target);
          }, 300);
        } else if (prefetchTimeout) {
          clearTimeout(prefetchTimeout);
          prefetchTimeout = null;
        }
      },
      { rootMargin: "0px", threshold: 0.1 },
    );

    observer.observe(linkElement);

    return () => {
      observer.disconnect();
      if (prefetchTimeout) {
        clearTimeout(prefetchTimeout);
      }
    };
  }, [hrefString, isHashOnly, prefetch, router]);

  return (
    <NextLink
      ref={linkRef}
      prefetch={false}
      onMouseEnter={(e) => {
        if (!isHashOnly) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- typed routes generate RouteImpl at build time
          router.prefetch(hrefString as any);
        }
        if (typeof onMouseEnter === "function") {
          onMouseEnter(e);
        }
      }}
      onMouseDown={(e) => {
        if (isHashOnly) {
          if (typeof onMouseDown === "function") {
            onMouseDown(e);
          }
          return;
        }
        const url = new URL(hrefString, window.location.href);
        if (
          url.origin === window.location.origin &&
          e.button === 0 &&
          !e.altKey &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey
        ) {
          e.preventDefault();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- typed routes generate RouteImpl at build time
          router.push(hrefString as any);
        }
        if (typeof onMouseDown === "function") {
          onMouseDown(e);
        }
      }}
      {...props}
    >
      {children}
    </NextLink>
  );
};
