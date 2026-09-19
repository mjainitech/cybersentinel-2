interface SuggestedPromptProps {
  text: string;
  onClick: (text: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompt({ text, onClick, disabled }: SuggestedPromptProps) {
  return (
    <button
      onClick={() => onClick(text)}
      disabled={disabled}
      className="rounded-full border border-base-border px-3.5 py-1.5 text-xs text-ink-muted transition-colors hover:border-accent-primary/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
    >
      {text}
    </button>
  );
}
