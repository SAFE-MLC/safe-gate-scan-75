// src/components/SuperSimpleQR.tsx
// Usando qr.js (ultra liviana, solo 8KB)
import { useState, useEffect, useRef } from 'react';
import QR from 'qr.js';
interface SuperSimpleQRProps {
  value: string;
}
const SuperSimpleQR = ({ value }: SuperSimpleQRProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  console.log("🚀 SuperSimpleQR renderizando con value:", value ? value.substring(0, 50) + "..." : "sin valor");
  useEffect(() => {
    if (!value) {
      setError('');
      return;
    }
    const generateQR = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Generar QR usando qr.js
        const qr = QR(value, {
          level: 'M', // Error correction level
          type: 2     // Tipo de output
        });
        // Dibujar en canvas
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('No se pudo obtener el contexto del canvas');
          }
          const cellSize = 6;
          const margin = cellSize * 2;
          const size = qr.modules.length;
          canvas.width = size * cellSize + margin * 2;
          canvas.height = size * cellSize + margin * 2;
          // Fondo blanco
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Módulos negros
          ctx.fillStyle = '#000000';
          for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
              if (qr.modules[row][col]) {
                ctx.fillRect(
                  col * cellSize + margin,
                  row * cellSize + margin,
                  cellSize,
                  cellSize
                );
              }
            }
          }
          console.log("✅ QR Code generado con qr.js");
        } else {
          throw new Error('Canvas no disponible');
        }
      } catch (err) {
        console.error("❌ Error generando QR Code:", err);
        setError('Error generando QR');
      } finally {
        setIsLoading(false);
      }
    };
    // Pequeño delay para asegurar que el canvas esté disponible
    const timer = setTimeout(() => {
      generateQR();
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);
  if (!value) {
    return (
<div className="w-40 h-40 bg-yellow-100 border-2 border-yellow-400 rounded flex items-center justify-center">
<div className="text-center text-yellow-800">
<div className="text-2xl mb-2">⏳</div>
<div className="text-xs">Sin JWT</div>
</div>
</div>
    );
  }
  if (isLoading) {
    return (
<div className="w-40 h-40 bg-gray-100 border-2 border-gray-300 rounded flex items-center justify-center">
<div className="text-center text-gray-600">
<div className="text-2xl mb-2">⏳</div>
<div className="text-xs">Generando...</div>
</div>
</div>
    );
  }
  if (error) {
    return (
<div className="w-40 h-40 bg-red-100 border-2 border-red-400 rounded flex items-center justify-center">
<div className="text-center text-red-800">
<div className="text-2xl mb-2">❌</div>
<div className="text-xs">{error}</div>
</div>
</div>
    );
  }
  return (
<div className="text-center">
<div className="w-40 h-40 bg-white border-2 border-gray-300 rounded overflow-hidden p-2 flex items-center justify-center">
<canvas
          ref={canvasRef}
          className="max-w-full max-h-full"
          style={{
            imageRendering: 'pixelated',
          }}
        />
</div>
<div className="mt-2 text-xs text-gray-500">
<div className="font-semibold">QR Rotativo</div>
<div>{value.length} caracteres</div>
<div className="font-mono text-xs opacity-75">
          {value.substring(0, 20)}...
</div>
</div>
</div>
  );
};
export default SuperSimpleQR;