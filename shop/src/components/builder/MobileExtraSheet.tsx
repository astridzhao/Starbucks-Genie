import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import ExtraCustomizations from "./ExtraCustomizations";

type Props = React.ComponentProps<typeof ExtraCustomizations> & {
  open: boolean;
  onClose: () => void;
  calorieLabel: string;
  estimated: boolean;
};

export default function MobileExtraSheet({
  open,
  onClose,
  calorieLabel,
  estimated,
  ...pickerProps
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current!;
    const media = window.matchMedia("(max-width: 650px)");
    if (!media.matches) {
      closeRef.current();
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    const viewport = window.visualViewport;
    const fitViewport = () => {
      const height = viewport?.height || window.innerHeight;
      dialog.style.maxHeight = `${Math.min(height - 12, 820)}px`;
      dialog.style.bottom = `${Math.max(0, window.innerHeight - height - (viewport?.offsetTop || 0))}px`;
    };
    const onResize = () => {
      if (!media.matches) closeRef.current();
      else fitViewport();
    };
    fitViewport();
    viewport?.addEventListener("resize", fitViewport);
    viewport?.addEventListener("scroll", fitViewport);
    media.addEventListener("change", onResize);
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      viewport?.removeEventListener("resize", fitViewport);
      viewport?.removeEventListener("scroll", fitViewport);
      media.removeEventListener("change", onResize);
    };
  }, [open]);
  const count = Object.values(pickerProps.build.extras || {}).filter(
    (quantity) => quantity > 0,
  ).length;
  return createPortal(
    <dialog
      ref={dialogRef}
      className="mobile-extra-sheet"
      aria-labelledby="extra-sheet-title"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="sheet-surface">
          <div className="sheet-grip" aria-hidden="true" />
          <header className="sheet-header">
            <div>
              <h2 id="extra-sheet-title">Make it extra</h2>
              <p>Pick flavors, then tap +</p>
            </div>
            <button
              className="sheet-close"
              aria-label="Close ingredient picker"
              onClick={onClose}
            >
              ×
            </button>
          </header>
          <div className="sheet-scroll">
            <ExtraCustomizations {...pickerProps} />
          </div>
          <footer className="sheet-footer">
            <div aria-live="polite">
              <strong>{calorieLabel} kcal</strong>
              <small>
                {estimated ? "Estimated total" : "Official nutrition"}
              </small>
            </div>
            <button
              className="primary-button"
              aria-label="Done choosing extras"
              onClick={onClose}
            >
              Done{count > 0 ? ` · ${count} selected` : ""}
            </button>
          </footer>
        </div>
      )}
    </dialog>,
    document.body,
  );
}
