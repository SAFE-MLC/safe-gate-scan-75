// src/components/QRScanner.tsx
import { useEffect, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

type Props = {
  onCode: (code: string) => void;
  onVideoRef?: (video: HTMLVideoElement | null) => void;
};

export default function QRScanner({ onCode, onVideoRef }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const video = wrapRef.current?.querySelector("video") as HTMLVideoElement | null;
      if (video) {
        onVideoRef?.(video);
        clearInterval(t);
      }
    }, 150);
    return () => clearInterval(t);
  }, [onVideoRef]);

  return (
    <div ref={wrapRef} className="w-full max-w-sm aspect-square overflow-hidden rounded-lg border relative">
      <Scanner
        onScan={(results) => {
          const v = results?.[0]?.rawValue;
          if (v) onCode(v);
        }}
        onError={(err) => console.error("QR error:", err)}
        components={{ finder: true }}
        constraints={{ facingMode: "environment" }}
      />
    </div>
  );
}
