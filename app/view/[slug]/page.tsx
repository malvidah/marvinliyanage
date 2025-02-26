import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export default async function ViewPage({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies })

  const { data: page } = await supabase.from("wiki_pages").select("content").eq("slug", params.slug).single()

  if (!page) {
    return <div>Page not found</div>
  }

  const renderContent = (content: string) => {
    return content.replace(/@(\w+)|(\[.*?\])/g, (match, account, pageLink) => {
      if (account) {
        return `<a href="https://x.com/${account}" class="bg-black text-white px-2 py-1 rounded">${match}</a>`
      }
      if (pageLink) {
        const linkText = pageLink.slice(1, -1)
        return `<a href="/view/${linkText}" class="bg-purple-100 text-purple-800 px-2 py-1 rounded">${linkText}</a>`
      }
      return match
    })
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{params.slug}</h1>
      <div dangerouslySetInnerHTML={{ __html: renderContent(page.content) }} />
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Connected Pages</h2>
        {/* Implement graph view here */}
      </div>
    </div>
  )
}

