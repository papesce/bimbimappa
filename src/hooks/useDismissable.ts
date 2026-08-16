import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

export interface DismissableOptions {
  /** Close on pointer-down outside the ref'd element. Default: true */
  outsideClick?: boolean;
  /** Close on Escape keydown. Default: true */
  closeOnEscape?: boolean;
}

export function useDismissable<T extends HTMLElement = HTMLElement>(
  onClose: () => void,
  options: DismissableOptions = {},
): RefObject<T> {
  const { outsideClick = true, closeOnEscape = true } = options;
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!outsideClick) return;
    const onPointerDown = (event: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const target = event.target as Node | null;
      if (target && el.contains(target)) return;
      onCloseRef.current();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [outsideClick]);

  useEffect(() => {
    if (!closeOnEscape) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeOnEscape]);

  return ref;
}
