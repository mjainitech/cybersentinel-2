import { Search } from "lucide-react";
import { Input } from "@/components/Input";

interface ThreatSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ThreatSearch({ value, onChange, placeholder }: ThreatSearchProps) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Search threats, CVE IDs, products, or vendors..."}
      leftIcon={<Search className="h-4 w-4" />}
    />
  );
}
