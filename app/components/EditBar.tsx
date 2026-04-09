"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"

export function useAdmin() {
  const { data: session, status } = useSession()
  const isAdmin =
    status === "authenticated" &&
    session?.user?.email === "marvin.liyanage@gmail.com"
  return { session, status, isAdmin }
}

export default function EditBar() {
  const { session, status, isAdmin } = useAdmin()
  const pathname = usePathname()

  if (status === "loading") return null
  if (pathname !== "/edit") return null

  // Small subtle button in bottom-right corner
  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {isAdmin && (
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            color: "var(--ink3)",
            background: "var(--bg-alt)",
            padding: "4px 10px",
            borderRadius: 4,
            border: "1px solid var(--border)",
          }}
        >
          Editing
        </span>
      )}
      <button
        onClick={() => (isAdmin ? signOut() : signIn("google"))}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 11,
          color: "var(--ink3)",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          padding: "6px 12px",
          borderRadius: 4,
          cursor: "pointer",
          transition: "border-color 0.15s",
          opacity: isAdmin ? 1 : 0.4,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => {
          if (!isAdmin) e.currentTarget.style.opacity = "0.4"
        }}
      >
        {isAdmin ? "Sign out" : "Edit"}
      </button>
    </div>
  )
}
