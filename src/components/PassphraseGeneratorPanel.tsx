import { useState } from "react";
import { Copy, Check, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/Button";
import { Tooltip } from "@/components/Tooltip";
import {
  generatePassphraseOptions,
  DEFAULT_PASSPHRASE_OPTIONS,
} from "@/utils/passphraseGenerator";
import type { PassphraseGeneratorOptions, PassphraseCapitalization } from "@/utils/passphraseGenerator";

const SEPARATOR_OPTIONS: { value: string; label: string }[] = [
  { value: "-", label: "Hyphen (-)" },
  { value: "_", label: "Underscore (_)" },
  { value: ".", label: "Period (.)" },
  { value: " ", label: "Space ( )" },
];

const CAPITALIZATION_OPTIONS: { value: PassphraseCapitalization; label: string }[] = [
  { value: "none", label: "lowercase" },
  { value: "first-letter", label: "Title Case" },
  { value: "all-caps", label: "ALL CAPS" },
  { value: "random", label: "rAnDoM" },
];

export function PassphraseGeneratorPanel() {
  const [options, setOptions] = useState<PassphraseGeneratorOptions>(DEFAULT_PASSPHRASE_OPTIONS);
  const [results, setResults] = useState<string[]>(() => generatePassphraseOptions(DEFAULT_PASSPHRASE_OPTIONS));
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const update = <K extends keyof PassphraseGeneratorOptions>(key: K, value: PassphraseGeneratorOptions[K]) => {
    const next = { ...options, [key]: value };
    setOptions(next);
  };

  const handleCopy = async (value: string, index: number) => {
    await navigator.clipboard.writeText(value);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-2 rounded-lg border border-accent-primary/20 bg-accent-primary/5 p-3 text-xs text-ink-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-primary" />
        <span>
          A passphrase of unrelated random words is often easier to remember and type than a random character string,
          while still being genuinely hard to guess — length and unpredictability matter more than complexity alone.
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between text-sm text-ink-muted">
            <span>Number of words</span>
            <span className="font-mono text-ink">{options.wordCount}</span>
          </div>
          <input
            type="range"
            min={3}
            max={8}
            value={options.wordCount}
            onChange={(e) => update("wordCount", Number(e.target.value))}
            className="mt-1 w-full accent-accent-primary"
            aria-label="Number of words"
          />
        </div>

        <div>
          <label className="text-sm text-ink-muted" htmlFor="passphrase-separator">
            Separator
          </label>
          <select
            id="passphrase-separator"
            value={options.separator}
            onChange={(e) => update("separator", e.target.value)}
            className="mt-1 w-full rounded-lg border border-base-border bg-base-surface px-3 py-2 text-sm text-ink focus:border-accent-primary focus:outline-none"
          >
            {SEPARATOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-ink-muted" htmlFor="passphrase-capitalization">
            Capitalization
          </label>
          <select
            id="passphrase-capitalization"
            value={options.capitalization}
            onChange={(e) => update("capitalization", e.target.value as PassphraseCapitalization)}
            className="mt-1 w-full rounded-lg border border-base-border bg-base-surface px-3 py-2 text-sm text-ink focus:border-accent-primary focus:outline-none"
          >
            {CAPITALIZATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-center gap-2">
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={options.includeNumber}
              onChange={(e) => update("includeNumber", e.target.checked)}
              className="h-4 w-4 rounded border-base-border bg-base-surface accent-accent-primary"
            />
            Add a number
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={options.includeSymbol}
              onChange={(e) => update("includeSymbol", e.target.checked)}
              className="h-4 w-4 rounded border-base-border bg-base-surface accent-accent-primary"
            />
            Add a symbol
          </label>
        </div>
      </div>

      <Button onClick={() => setResults(generatePassphraseOptions(options))} leftIcon={<RefreshCw className="h-4 w-4" />}>
        Generate New Passphrases
      </Button>

      <div className="flex flex-col gap-2">
        {results.map((passphrase, index) => (
          <div key={index} className="flex items-center gap-2 rounded-xl border border-base-border bg-base-elevated/40 p-3">
            <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-ink">{passphrase}</code>
            <button
              onClick={() => handleCopy(passphrase, index)}
              aria-label="Copy passphrase"
              className="shrink-0 rounded-lg p-2 text-ink-faint transition-colors hover:bg-base-elevated hover:text-accent-primary"
            >
              {copiedIndex === index ? <Check className="h-4 w-4 text-accent-secondary" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-ink-faint">
        Generated locally from a ~248-word list using the Web Crypto API — never sent anywhere, never saved.
        <Tooltip content="A larger, dedicated wordlist (like the EFF long list) would provide more entropy per word than this curated subset.">
          <Info className="h-3 w-3 cursor-help" />
        </Tooltip>
      </p>
    </div>
  );
}
