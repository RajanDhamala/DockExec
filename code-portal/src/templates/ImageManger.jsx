import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Trash2, Eye } from "lucide-react"
import ImageViewer from "./ImageViewer"

export default function ImageManager({ images, setImages }) {
  const fileInputRef = useRef(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const MAX_IMAGES = 3
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert("Only JPG, PNG, and WebP images are allowed")
        return
      }

      if (images.length >= MAX_IMAGES) {
        alert(`Maximum ${MAX_IMAGES} images allowed`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages([...images, e.target.result])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
    if (selectedImageIndex === index) {
      setSelectedImageIndex(null)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      <label className="block text-gray-900 dark:text-white font-medium">Attachments (Optional)</label>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${dragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-gray-800/50 hover:border-blue-500/50"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <Upload className="mx-auto mb-3 text-gray-500 dark:text-slate-400" size={24} />
        <p className="text-gray-900 dark:text-white font-medium">Drag and drop images here</p>
        <p className="text-sm text-gray-600 dark:text-slate-400">or</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 bg-transparent border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Choose Files
        </Button>
        <p className="mt-3 text-xs text-gray-600 dark:text-slate-400">JPG, PNG, WebP • Max {MAX_IMAGES} images • Max 5MB each</p>
      </div>

      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Images ({images.length}/{MAX_IMAGES})
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image, index) => (
              <Card key={index} className="group relative overflow-hidden border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-900">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Attachment ${index + 1}`}
                  className="h-32 w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition-all group-hover:bg-black/40">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedImageIndex(index)}
                    className="opacity-0 transition-opacity group-hover:opacity-100 text-white hover:bg-white/20"
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeImage(index)}
                    className="opacity-0 transition-opacity group-hover:opacity-100 text-white hover:bg-white/20"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedImageIndex !== null && (
        <ImageViewer
          image={images[selectedImageIndex]}
          onClose={() => setSelectedImageIndex(null)}
          imageNumber={selectedImageIndex + 1}
          totalImages={images.length}
        />
      )}
    </div>
  )
}
