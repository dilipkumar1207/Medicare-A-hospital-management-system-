import React, { useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, XIcon } from './Icons'

function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  const isSuccess = type === "success"

  return (
    <div className="fixed top-6 right-3 left-3 sm:right-6 sm:left-auto z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-[slideIn_.3s_ease] bg-white border"
      style={{ borderColor: isSuccess ? '#bfdbfe' : '#fecdd3' }}>
      {isSuccess ? (
        <CheckCircleIcon className="w-5 h-5 text-blue-600 shrink-0" />
      ) : (
        <XCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />
      )}
      <p className={`text-sm ${isSuccess ? "text-blue-700" : "text-rose-700"}`}>{message}</p>
      <button onClick={onClose} className="ml-auto p-1 rounded-full hover:bg-black/5 cursor-pointer">
        <XIcon className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  )
}

export default Toast
