"use client";

import { useEffect, useState } from "react";

type DialogKind = "alert" | "confirm";

interface DialogState {
  id: number;
  kind: DialogKind;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  resolve: (value: boolean) => void;
}

let current: DialogState | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function open(kind: DialogKind, message: string, options: { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean } = {}) {
  return new Promise<boolean>((resolve) => {
    current = {
      id: nextId++,
      kind,
      message,
      title: options.title ?? (kind === "confirm" ? "Please confirm" : "Notice"),
      confirmLabel: options.confirmLabel ?? (kind === "confirm" ? "Confirm" : "OK"),
      cancelLabel: options.cancelLabel ?? "Cancel",
      danger: options.danger ?? false,
      resolve,
    };
    emit();
  });
}

/** Replacement for window.alert — resolves once the person dismisses the overlay. */
export function showAlert(message: string, options?: { title?: string; confirmLabel?: string }) {
  return open("alert", message, options);
}

/** Replacement for window.confirm — resolves true/false, matching confirm()'s return contract. */
export function showConfirm(message: string, options?: { title?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) {
  return open("confirm", message, options);
}

function useCurrentDialog() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((tick) => tick + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return current;
}

function settle(value: boolean) {
  if (!current) return;
  const resolve = current.resolve;
  current = null;
  emit();
  resolve(value);
}

/**
 * Mount once near the root of the admin app. Renders the in-app overlay used
 * by showAlert/showConfirm in place of the browser's native alert()/confirm().
 */
export default function DialogHost() {
  const dialog = useCurrentDialog();

  useEffect(() => {
    if (!dialog) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") settle(false);
      if (event.key === "Enter") settle(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialog]);

  if (!dialog) return null;

  return (
    <div
      className="admin-overlay-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-brand-teal/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={() => settle(false)}
    >
      <div
        className="admin-overlay-panel w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        role={dialog.kind === "confirm" ? "alertdialog" : "alertdialog"}
        aria-modal="true"
        aria-labelledby={`dialog-title-${dialog.id}`}
        aria-describedby={`dialog-message-${dialog.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <p id={`dialog-title-${dialog.id}`} className={`text-xs font-semibold uppercase tracking-[0.14em] ${dialog.danger ? "text-brand-rust" : "text-brand-teal/60"}`}>
          {dialog.title}
        </p>
        <p id={`dialog-message-${dialog.id}`} className="mt-3 text-sm leading-6 text-brand-teal/80">
          {dialog.message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {dialog.kind === "confirm" && (
            <button
              type="button"
              onClick={() => settle(false)}
              className="admin-action-button rounded-lg border border-black/10 px-4 py-2 text-xs font-semibold text-brand-teal/70"
            >
              {dialog.cancelLabel}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => settle(true)}
            className={`admin-action-button rounded-lg px-4 py-2 text-xs font-semibold text-white ${dialog.danger ? "bg-brand-rust" : "bg-brand-teal"}`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
