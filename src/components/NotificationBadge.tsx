interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-danger px-1 text-[10px] font-semibold text-white"
      aria-hidden="true"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
