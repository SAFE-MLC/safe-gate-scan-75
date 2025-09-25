// src/components/SuperSimpleQR.tsx

interface SuperSimpleQRProps {
  value: string;
}

const SuperSimpleQR = ({ value }: SuperSimpleQRProps) => {
  console.log("🚀 SuperSimpleQR renderizando con value:", value ? value.substring(0, 50) + "..." : "sin valor");
  console.log("🔍 SuperSimpleQR: value completo =", !!value, "length =", value?.length);

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

  // Generar URL del QR usando API pública
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(value)}&format=png&ecc=M&bgcolor=FFFFFF&color=000000`;
  
  console.log("📸 URL del QR generada:", qrUrl);

  return (
    <div className="text-center">
      <div className="w-40 h-40 bg-white border-2 border-gray-300 rounded overflow-hidden p-2">
        <img 
          src={qrUrl}
          alt="QR Code"
          className="w-full h-full object-contain"
          onLoad={() => console.log("✅ Imagen QR cargada exitosamente")}
          onError={(e) => {
            console.error("❌ Error cargando imagen QR:", e);
          }}
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