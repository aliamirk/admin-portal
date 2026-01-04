'use client'

import { useRouter } from 'next/navigation'

export default function ReturnButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/admin')}
      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
    >
      Return
    </button>
  )
}
