import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getServiceClient } from "@/lib/supabase-server"

const ALLOWED_EMAIL = "marvin.liyanage@gmail.com"

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (session?.user?.email !== ALLOWED_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File
  const slug = formData.get("slug") as string

  if (!file || !slug) {
    return NextResponse.json({ error: "Missing file or slug" }, { status: 400 })
  }

  const sb = getServiceClient()
  const ext = file.name.split(".").pop()
  const path = `entries/${slug}.${ext}`

  // Upload to storage
  const { error: uploadError } = await sb.storage
    .from("site-images")
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: urlData } = sb.storage.from("site-images").getPublicUrl(path)
  const imageUrl = urlData.publicUrl

  // Update entry
  const { error: updateError } = await sb
    .from("site_entries")
    .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq("slug", slug)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ imageUrl })
}
