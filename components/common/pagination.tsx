"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Max consecutive page numbers to show before collapsing to ellipsis (default 5) */
  windowSize?: number;
  className?: string;
}

/** Computes the array of page tokens to render, e.g. [1, "...", 4, 5, 6, "...", 12] */
function buildPageTokens(current: number, total: number, window: number): (number | "...")[] {
  if (total <= window) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(window / 2);
  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, current + half);

  // Keep the window full when near edges
  if (end - start + 1 < window - 2) {
    if (current <= half + 1) {
      end = Math.min(total - 1, window - 1);
    } else {
      start = Math.max(2, total - window + 2);
    }
  }

  const tokens: (number | "...")[] = [1];
  if (start > 2) tokens.push("...");
  for (let p = start; p <= end; p++) tokens.push(p);
  if (end < total - 1) tokens.push("...");
  tokens.push(total);

  return tokens;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  windowSize = 5,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const tokens = buildPageTokens(currentPage, totalPages, windowSize);
  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1 select-none", className)}
    >
      {/* Chevron left */}
      <ChevronButton
        direction="left"
        disabled={isFirst}
        onClick={() => !isFirst && onPageChange(currentPage - 1)}
        aria-label="Previous page"
      />

      {/* Page tokens */}
      <div className="flex items-center gap-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {tokens.map((token, idx) =>
            token === "..." ? (
              <motion.span
                key={`ellipsis-${idx}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
                aria-hidden
              >
                …
              </motion.span>
            ) : (
              <PageButton
                key={token}
                page={token}
                isActive={token === currentPage}
                onClick={() => onPageChange(token)}
              />
            )
          )}
        </AnimatePresence>
      </div>

      {/* Chevron right */}
      <ChevronButton
        direction="right"
        disabled={isLast}
        onClick={() => !isLast && onPageChange(currentPage + 1)}
        aria-label="Next page"
      />
    </nav>
  );
}

/* ── Internal sub-components ──────────────────────────────────────────────── */

interface ChevronButtonProps {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
  "aria-label": string;
}

function ChevronButton({ direction, disabled, onClick, "aria-label": label }: ChevronButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        disabled
          ? "cursor-not-allowed opacity-35"
          : "cursor-pointer hover:border-primary/50 hover:bg-accent hover:text-foreground active:scale-95"
      )}
    >
      {direction === "left" ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );
}

interface PageButtonProps {
  page: number;
  isActive: boolean;
  onClick: () => void;
}

function PageButton({ page, isActive, onClick }: PageButtonProps) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.75 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={onClick}
      aria-label={`Page ${page}`}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex h-8 min-w-[2rem] items-center justify-center rounded-md border px-2 text-sm font-medium",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        isActive
          ? "border-primary bg-primary text-primary-foreground cursor-default"
          : "border-border bg-transparent text-foreground/70 cursor-pointer hover:border-primary/40 hover:bg-accent hover:text-foreground active:scale-95"
      )}
    >
      {page}
      {isActive && (
        <motion.span
          layoutId="active-page-indicator"
          className="absolute inset-0 rounded-md bg-primary"
          style={{ zIndex: -1 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        />
      )}
    </motion.button>
  );
}
