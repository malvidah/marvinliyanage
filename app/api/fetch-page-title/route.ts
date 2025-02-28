import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      },
      redirect: 'follow',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Try multiple methods to extract the title
    
    // 1. Try standard title tag
    let title = null;
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    
    // 2. Try Open Graph title
    if (!title || title.length < 2) {
      const ogMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
      if (ogMatch && ogMatch[1]) {
        title = ogMatch[1].trim();
      }
    }
    
    // 3. Try Twitter card title
    if (!title || title.length < 2) {
      const twitterMatch = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
      if (twitterMatch && twitterMatch[1]) {
        title = twitterMatch[1].trim();
      }
    }
    
    // 4. Try h1 tag as last resort
    if (!title || title.length < 2) {
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match && h1Match[1]) {
        title = h1Match[1].trim();
      }
    }
    
    // If we still don't have a title, use the domain
    if (!title || title.length < 2) {
      const domain = new URL(url).hostname.replace('www.', '');
      title = domain;
    }
    
    return NextResponse.json({ 
      title: title,
      url 
    });
  } catch (error) {
    console.error('Error fetching page title:', error);
    // Return domain as fallback
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return NextResponse.json({ 
        title: domain,
        url
      });
    } catch {
      return NextResponse.json({ 
        title: url,
        url
      });
    }
  }
} 