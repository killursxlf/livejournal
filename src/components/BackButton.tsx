import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function BackButton() {
  return (
    <Link
      href="/posts"
      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="sr-only">Back to blog</span>
    </Link>
  )
}

