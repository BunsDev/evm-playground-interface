import { memo, type FC } from "react";
import clsx from "clsx";

export type SerializedTagged = {
  __type: "bigint" | "function" | "symbol" | "Error" | "Date";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export interface RenderOptions {
  shortenHex?: boolean;
  hexHead?: number;
  hexTail?: number;
  maxString?: number;
}

/**
 * Default rendering behaviour for string truncation, hex shortening, and max output size.
 */
const DEFAULT_OPTIONS: Required<
  Pick<RenderOptions, "shortenHex" | "hexHead" | "hexTail" | "maxString">
> = {
  shortenHex: true,
  hexHead: 6,
  hexTail: 4,
  maxString: 10_000,
};

/**
 * Determines whether a value has been tagged during serialization in the runtime sandbox.
 */
export function isTagged(value: unknown): value is SerializedTagged {
  return (
    !!value &&
    typeof value === "object" &&
    Object.prototype.hasOwnProperty.call(value as SerializedTagged, "__type")
  );
}

/**
 * Narrows a value to a hex string without relying on the consumer to re-check.
 */
export function isHexString(value: unknown): value is string {
  return typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value);
}

/**
 * Shortens a hex string while preserving the prefix, head, and tail sections.
 */
export function shortenHex(hex: string, head = 6, tail = 4): string {
  if (!isHexString(hex)) return String(hex);
  if (hex.length <= 2 + head + tail) return hex;
  return `${hex.slice(0, 2 + head)}…${hex.slice(-tail)}`;
}

/**
 * Converts special serialized objects (bigints, errors, symbols) to human-readable strings.
 */
export function coerceDisplayValue(value: unknown): unknown {
  if (isTagged(value)) {
    switch (value.__type) {
      case "bigint":
        return `${value.value}n`;
      case "Date":
        return value.value || value.toString || value;
      case "Error":
        return `${value.name || "Error"}: ${value.message || ""}`.trim();
      case "function":
        return `ƒ ${value.name || "anonymous"}()`;
      case "symbol":
        return String(value.value ?? value);
    }
  }
  return value;
}

/**
 * Returns a lightweight description of a value for debugging helpers.
 */
export function describeType(value: unknown): string {
  if (isTagged(value)) return value.__type;
  if (isHexString(value)) return `hex(${(value.length - 2) / 2} bytes)`;
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

/**
 * Produces a succinct, single-line representation suitable for inline hints.
 */
export function formatBrief(value: unknown, opts?: RenderOptions): string {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const v = coerceDisplayValue(value);
  try {
    if (v === null) return "null";
    if (v === undefined) return "undefined";
    if (typeof v === "string") {
      if (options.shortenHex && isHexString(v))
        return shortenHex(v, options.hexHead, options.hexTail);
      return v.length > 120 ? `${v.slice(0, 117)}…` : v;
    }
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return `Array(${v.length})`;
    if (typeof v === "object") {
      try {
        const json = JSON.stringify(v);
        return json.length > 120 ? `${json.slice(0, 117)}…` : json;
      } catch {
        return "[Object]";
      }
    }
    return String(v);
  } catch {
    return "[value]";
  }
}

/**
 * Creates a full representation of a value, respecting configured truncation limits.
 */
export function formatFull(value: unknown, opts?: RenderOptions): string {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const v = coerceDisplayValue(value);
  try {
    if (typeof v === "string") {
      if (options.shortenHex && isHexString(v))
        return shortenHex(v, options.hexHead, options.hexTail);
      return v.length > options.maxString
        ? `${v.slice(0, options.maxString)}…`
        : v;
    }
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (v === null) return "null";
    if (v === undefined) return "undefined";
    return JSON.stringify(v, null, 2);
  } catch {
    try {
      return String(v);
    } catch {
      return "[Unserializable]";
    }
  }
}

/**
 * Safely escapes code fences so we can embed values inside markdown tooltips.
 */
export function escapeMarkdownCode(text: string): string {
  // prevents: accidental closing of code fences inside content
  return String(text).replace(/```/g, "``\u200B`");
}

/**
 * Produces markdown-formatted output that can be consumed by Monaco hover providers.
 */
export function formatHoverMarkdown(
  value: unknown,
  opts?: RenderOptions
): string {
  const body = formatFull(value, opts);
  return `\`\`\`json\n${escapeMarkdownCode(body)}\n\`\`\``;
}

export interface ValueRendererProps {
  value: unknown;
  variant?: "brief" | "full";
  options?: RenderOptions;
  className?: string;
}

/**
 * Lightweight renderer used inside inline log panels and hover tooltips.
 */
const ValueRendererComponent: FC<ValueRendererProps> = ({
  value,
  variant = "full",
  options,
  className,
}) => {
  const v = coerceDisplayValue(value);
  const text =
    variant === "brief" ? formatBrief(v, options) : formatFull(v, options);
  // TODO: Build richer presentation (copy to clipboard, decoding helpers) once UI stabilises.
  return (
    <pre
      className={clsx(
        "whitespace-pre-wrap wrap-break-word text-green-300",
        className
      )}
      data-value-type={describeType(v)}
    >
      {text}
    </pre>
  );
};

ValueRendererComponent.displayName = "ValueRenderer";

export const ValueRenderer = memo(ValueRendererComponent);
