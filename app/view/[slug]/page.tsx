import { redirect } from 'next/navigation';

export default function ViewSlugPage({ params }) {
  const { slug } = params;
  redirect(`/${slug}`);
} 