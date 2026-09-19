import { useCallback, useState } from "react";

/**
 * Generic open/close state, shared by the Modal, mobile nav, and any
 * future dropdown/popover so we don't rewrite the same three lines
 * of useState everywhere.
 */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
