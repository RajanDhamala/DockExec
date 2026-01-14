import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function FeedbackStatus({ type, message }) {
  const isSuccess = type === "success"

  return (
    <Card
      className={`mb-6 flex items-center gap-3 border p-4 ${isSuccess
        ? "border-green-400/20 bg-green-900/20 text-green-400"
        : "border-red-400/20 bg-red-900/20 text-red-400"
        }`}
    >
      {isSuccess ? (
        <>
          <CheckCircle2 size={20} className="flex-shrink-0 text-green-400" />
          <p className="text-sm font-medium text-green-400">{message}</p>
        </>
      ) : (
        <>
          <AlertCircle size={20} className="flex-shrink-0 text-red-400" />
          <p className="text-sm font-medium text-red-400">{message}</p>
        </>
      )}
    </Card>
  )
}
