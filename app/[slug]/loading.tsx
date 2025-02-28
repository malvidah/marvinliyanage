export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse flex space-x-2">
        <div className="h-3 w-3 bg-purple-600 rounded-full"></div>
        <div className="h-3 w-3 bg-purple-600 rounded-full"></div>
        <div className="h-3 w-3 bg-purple-600 rounded-full"></div>
      </div>
    </div>
  )
} 