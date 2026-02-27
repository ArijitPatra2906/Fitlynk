"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        style: {
          background: '#131520',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
        },
        className: 'toaster-custom',
      }}
    />
  );
}
