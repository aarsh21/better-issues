"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";

import { Link as TanStackLink } from "@tanstack/react-router";
import { useRouter } from "@/lib/navigation";
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
  href,
  ...props
}: ComponentPropsWithoutRef<"a"> & {
  href: string;
  prefetch?: boolean;
}) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  const hrefString = useMemo(() => String(href), [href]);
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
            router.prefetch(hrefString);
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

  const handleMouseEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isHashOnly) {
      router.prefetch(hrefString);
    }
    if (typeof onMouseEnter === "function") {
      onMouseEnter(e);
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLAnchorElement>) => {
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
      router.push(hrefString);
    }
    if (typeof onMouseDown === "function") {
      onMouseDown(e);
    }
  };

  if (isHashOnly) {
    return (
      <a
        ref={linkRef}
        href={hrefString}
        onMouseEnter={handleMouseEnter}
        onMouseDown={handleMouseDown}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <TanStackLink
      ref={linkRef}
      to={hrefString as never}
      preload={false}
      onMouseEnter={handleMouseEnter}
      onMouseDown={handleMouseDown}
      {...props}
    >
      {children}
    </TanStackLink>
  );
};
