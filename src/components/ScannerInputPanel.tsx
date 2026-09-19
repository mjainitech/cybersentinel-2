import { Globe2, Sparkles, X, ScanLine } from "lucide-react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

interface ScannerInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onScan: () => void;
  onUseExample: () => void;
  onClear: () => void;
  isScanning: boolean;
  placeholder?: string;
  label?: string;
}

/**
 * Large input panel shared by scanner pages (URL scanner today; email
 * and resume scanners can reuse this same shell with a different
 * placeholder/label). Keeps the input + action buttons together as
 * one unit so the page component only manages state and validation.
 */
export function ScannerInputPanel({
  value,
  onChange,
  onScan,
  onUseExample,
  onClear,
  isScanning,
  placeholder = "https://example.com",
  label = "Website URL",
}: ScannerInputPanelProps) {
  return (
    <Card className="p-6 sm:p-8" glass>
      <Input
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        leftIcon={<Globe2 className="h-4 w-4" />}
        rightElement={
          value ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear input"
              className="pointer-events-auto text-ink-faint hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          ) : undefined
        }
        className="!py-4 text-base"
        onKeyDown={(event) => {
          if (event.key === "Enter") onScan();
        }}
        disabled={isScanning}
      />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="flex-1"
          onClick={onScan}
          isLoading={isScanning}
          leftIcon={!isScanning ? <ScanLine className="h-4 w-4" /> : undefined}
        >
          {isScanning ? "Scanning..." : "Scan"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onUseExample}
          disabled={isScanning}
          leftIcon={<Sparkles className="h-4 w-4" />}
        >
          Example URL
        </Button>
        <Button variant="ghost" size="lg" onClick={onClear} disabled={isScanning || !value}>
          Clear
        </Button>
      </div>
    </Card>
  );
}
