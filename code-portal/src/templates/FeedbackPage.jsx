import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import axios from "axios"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, } from "lucide-react"
import ImageManager from "./ImageManger"

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
  })
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors = {}

    if (!formData.subject.trim()) {

      toast.error("Subject is required")
      newErrors.subject = "Subject is required"
    }
    if (!formData.description.trim()) {

      toast.error("Description is required")
      newErrors.description = "Description is required"
    }
    if (formData.description.length < 10) {
      toast.error("Description must be at least 10 characters")
      newErrors.description = "Description must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    setIsSubmitting(true)
    await submitFeedback()

  }

  const submitFeedback = async () => {
    try {
      console.log("Submitting form...");

      const form = new FormData();
      form.append("title", formData.subject);
      form.append("description", formData.description);

      for (const file of images) {
        if (typeof file === "string" && file.startsWith("data:")) {
          const res = await fetch(file);
          const blob = await res.blob();

          const mime = blob.type.split("/")[1];
          const filename = `image_${Date.now()}.${mime}`;

          form.append("images", blob, filename);
        } else {
          form.append("images", file);
        }
      }

      const response = await axios.post(
        "http://localhost:8000/api/feedback",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Thanks for Your feedback")
    } catch (err) {
      toast.error("Error during submission")
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to={"/"} className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-mono">
              {"{"}
            </div>
            <span className="text-gray-900 dark:text-white">DockExec</span>
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Share Your Feedback
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-slate-400">
              Help us improve by reporting bugs or sharing your ideas
            </p>
          </div>
        </div>


        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-gray-900 dark:text-white">
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="Brief description of your feedback"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className={`h-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg ${errors.subject ? "border-red-500" : ""}`}
              />
              {errors.subject && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle size={16} />
                  {errors.subject}
                </div>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-900 dark:text-white">
                Description
              </Label>

              <Textarea
                id="description"
                placeholder="Provide detailed information about your feedback or bug report"
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`h-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg ${errors.description ? "border-red-500" : ""}`}

              />
              <div className="flex items-center justify-between">
                {errors.description && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle size={16} />
                    {errors.description}
                  </div>
                )}
                <span className="text-sm text-gray-600 dark:text-slate-400">{formData.description.length}/500</span>
              </div>
            </div>

            <ImageManager images={images} setImages={setImages} />

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} className="mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({ subject: "", description: "" })
                  setImages([])
                  setErrors({})
                }}
                className="bg-transparent border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Clear
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-8 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-gray-800/50 p-4 text-center text-sm text-gray-600 dark:text-slate-400 shadow-sm">
          <p>Your feedback helps us create a better experience. We appreciate your input!</p>
        </div>
      </div>
    </div>
  )
}
