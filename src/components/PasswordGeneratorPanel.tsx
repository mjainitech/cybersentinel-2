import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/Button";
import {
  generatePasswordOptions,
  DEFAULT_PASSWORD_OPTIONS,
} from "@/utils/passwordGenerator";
import type { PasswordGeneratorOptions } from "@/utils/passwordGenerator";
import { useToast } from "@/hooks/useToast";

/** Small reusable toggle row — used for every boolean option in this panel. */
function ToggleOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5">
      <span className="text-sm text-ink-muted">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-accent-primary" : "bg-base-elevated"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </button>
    </label>
  );
}

export function PasswordGeneratorPanel() {
  const [options, setOptions] = useState<PasswordGeneratorOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [results, setResults] = useState<string[]>(() => generatePasswordOptions(DEFAULT_PASSWORD_OPTIONS));
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { showToast } = useToast();

  const update = <K extends keyof PasswordGeneratorOptions>(key: K, value: PasswordGeneratorOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const regenerate = (nextOptions: PasswordGeneratorOptions = options) => {
    const hasAnyCharset =
      nextOptions.includeUppercase || nextOptions.includeLowercase || nextOptions.includeNumbers || nextOptions.includeSymbols;
    if (!hasAnyCharset) {
      showToast("Select at least one character type.", "error");
      return;
    }
    setResults(generatePasswordOptions(nextOptions));
  };

  const handleCopy = async (value: string, index: number) => {
    await navigator.clipboard.writeText(value);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between text-sm text-ink-muted">
            <span>Length</span>
            <span className="font-mono text-ink">{options.length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={options.length}
            onChange={(e) => update("length", Number(e.target.value))}
            className="mt-1 w-full accent-accent-primary"
            aria-label="Password length"
          />
        </div>

        <div className="flex flex-col">
          <ToggleOption label="Uppercase (A-Z)" checked={options.includeUppercase} onChange={(v) => update("includeUppercase", v)} />
          <ToggleOption label="Lowercase (a-z)" checked={options.includeLowercase} onChange={(v) => update("includeLowercase", v)} />
          <ToggleOption label="Numbers (0-9)" checked={options.includeNumbers} onChange={(v) => update("includeNumbers", v)} />
          <ToggleOption label="Symbols (!@#$)" checked={options.includeSymbols} onChange={(v) => update("includeSymbols", v)} />
          <ToggleOption label="Exclude similar characters (i, l, 1, O, 0)" checked={options.excludeSimilar} onChange={(v) => update("excludeSimilar", v)} />
          <ToggleOption label="Exclude ambiguous symbols" checked={options.excludeAmbiguous} onChange={(v) => update("excludeAmbiguous", v)} />
        </div>
      </div>

      <Button onClick={() => regenerate()} leftIcon={<RefreshCw className="h-4 w-4" />}>
        Generate New Passwords
      </Button>

      <div className="flex flex-col gap-2">
        {results.map((password, index) => (
          <div key={index} className="flex items-center gap-2 rounded-xl border border-base-border bg-base-elevated/40 p-3">
            <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-ink">{password}</code>
            <button
              onClick={() => handleCopy(password, index)}
              aria-label="Copy password"
              className="shrink-0 rounded-lg p-2 text-ink-faint transition-colors hover:bg-base-elevated hover:text-accent-primary"
            >
              {copiedIndex === index ? <Check className="h-4 w-4 text-accent-secondary" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-ink-faint">
        Generated locally in your browser using the Web Crypto API — never sent anywhere, never saved.
      </p>
    </div>
  );
}
