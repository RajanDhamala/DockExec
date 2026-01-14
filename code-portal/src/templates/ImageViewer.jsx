
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, Pen } from "lucide-react"


export default function ImageViewer({ image, onClose, imageNumber, totalImages }) {
  const [zoom, setZoom] = useState(100)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingEnabled, setDrawingEnabled] = useState(false)
  const [brushSize, setBrushSize] = useState(3)
  const [brushColor, setBrushColor] = useState("#ff0000")
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const imageRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (drawingEnabled && canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        canvas.width = imageRef.current.offsetWidth
        canvas.height = imageRef.current.offsetHeight
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [drawingEnabled])

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -10 : 10
    setZoom((prev) => Math.max(50, Math.min(200, prev + delta)))
  }

  const getCanvasCoordinates = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width)
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height)
    return { x, y }
  }

  const startDrawing = (e) => {
    if (!drawingEnabled) return
    setIsDrawing(true)
    const { x, y } = getCanvasCoordinates(e)
    const ctx = canvasRef.current?.getContext("2d")
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const draw = (e) => {
    if (!isDrawing || !drawingEnabled) return
    const { x, y } = getCanvasCoordinates(e)
    const ctx = canvasRef.current?.getContext("2d")
    if (ctx) {
      ctx.lineWidth = brushSize
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = brushColor
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const ctx = canvasRef.current?.getContext("2d")
    if (ctx) {
      ctx.closePath()
    }
  }

  const clearDrawing = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="relative flex h-full w-full max-w-4xl flex-col rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Image {imageNumber} of {totalImages}
            </p>
            <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-900 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
              <X size={20} />
            </Button>
          </div>

          <div
            ref={containerRef}
            onWheel={handleWheel}
            className="relative flex flex-1 items-center justify-center overflow-auto bg-gray-100 dark:bg-gray-950 p-4"
          >
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transition: "transform 0.2s ease-out",
              }}
              className="relative"
            >
              <img
                ref={imageRef}
                src={image || "/placeholder.svg"}
                alt="Full size preview"
                className="max-h-full max-w-full select-none"
                draggable:false
              />
              {drawingEnabled && (
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="absolute inset-0 cursor-crosshair"
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-gray-800/50 p-4">
            {drawingEnabled && (
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs font-medium text-gray-900 dark:text-white">Brush:</label>
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-gray-200 dark:border-slate-700"
                />
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-xs text-gray-600 dark:text-slate-400">{brushSize}px</span>
                <Button
                  onClick={clearDrawing}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 ml-auto"
                >
                  Clear Drawing
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={() => setZoom((prev) => Math.max(50, prev - 10))}
                variant="outline"
                size="sm"
                className="bg-transparent border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ZoomOut size={18} />
              </Button>

              <span className="w-16 text-center text-sm font-medium text-gray-900 dark:text-white">{zoom}%</span>

              <Button
                onClick={() => setZoom((prev) => Math.min(200, prev + 10))}
                variant="outline"
                size="sm"
                className="bg-transparent border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ZoomIn size={18} />
              </Button>

              <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-slate-700" />

              <Button
                onClick={() => setDrawingEnabled(!drawingEnabled)}
                variant={drawingEnabled ? "default" : "outline"}
                size="sm"
                className={drawingEnabled ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-transparent border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"}
              >
                <Pen size={18} />
              </Button>

              <Button
                onClick={() => {
                  setZoom(100)
                  clearDrawing()
                  setDrawingEnabled(false)
                }}
                variant="outline"
                size="sm"
                className="bg-transparent border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
