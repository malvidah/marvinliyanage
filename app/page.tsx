import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/hello')
  return null
} 