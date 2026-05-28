import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureBase64: string) => void;
  onCancel: () => void;
}

export default function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Resize canvas to fill its container nicely matching high DPI screens
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
      
      // Canvas background and brush setups
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a'; // Slate-900 brush ink
      ctx.lineWidth = 2.5;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Helper to get raw coordinates from events (touch or mouse)
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Check if it is a touch event
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent scrolling when signing on mobile phones
    if (e.cancelable) {
      e.preventDefault();
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.cancelable) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSigned) return;

    // Retrieve high quality 2x resolution Base64
    const base64Url = canvas.toDataURL('image/png');
    onSave(base64Url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4 text-white text-left max-w-md w-full mx-auto" ref={containerRef}>
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs uppercase tracking-wider">
          <PenTool className="h-4 w-4" />
          <span>Firma Digital del Cliente</span>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
        Utiliza el dedo o un lápiz táctil directamente sobre el panel blanco de abajo para autorizar la reparación.
      </p>

      {/* Signature Area Draw Container */}
      <div className="relative border border-slate-755 rounded-xl overscroll-none touch-none overflow-hidden bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-44 cursor-crosshair block"
        />
        {!hasSigned && (
          <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none select-none text-slate-350 bg-slate-100/10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Firmar con el dedo aquí</span>
            <div className="h-0.5 w-16 bg-slate-300 mt-2"></div>
          </div>
        )}
      </div>

      {/* Actions panel */}
      <div className="flex gap-2.5">
        <button
          onClick={clearCanvas}
          type="button"
          disabled={!hasSigned}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-350 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Borrar</span>
        </button>

        <button
          onClick={handleConfirm}
          type="button"
          disabled={!hasSigned}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-extrabold rounded-xl shadow transition-all active:scale-95 cursor-pointer"
        >
          <Check className="h-3.5 w-3.5" />
          <span>Confirmar Firma</span>
        </button>
      </div>
    </div>
  );
}
