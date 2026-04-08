import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getServiceClient } from "@/lib/supabase-server"

const ALLOWED_EMAIL = "marvin.liyanage@gmail.com"

async function isAuthed() {
  const session = await getServerSession()
  return session?.user?.email === ALLOWED_EMAIL
}

// GET: fetch all entries + about content (public)
export async function GET() {
  const sb = getServiceClient()

  const [entriesRes, aboutRes] = await Promise.all([
    sb.from("site_entries").select("*").order("sort_order", { ascending: true }),
    sb.from("site_about").select("*"),
  ])

  return NextResponse.json({
    entries: entriesRes.data ?? [],
    about: Object.fromEntries(
      (aboutRes.data ?? []).map((r: any) => [r.key, r.value])
    ),
  })
}

// PATCH: update a single entry field (auth required)
export async function PATCH(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { table, id, slug, key, field, value } = body
  const sb = getServiceClient()

  if (table === "site_about") {
    const { error } = await sb
      .from("site_about")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const update: any = { [field]: value, updated_at: new Date().toISOString() }
    const { error } = await sb
      .from("site_entries")
      .update(update)
      .eq("slug", slug)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
