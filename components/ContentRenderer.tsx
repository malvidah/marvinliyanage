import { useCallback } from 'react';
import Link from 'next/link';

interface ContentRendererProps {
  content: any;
}

export default function ContentRenderer({ content }: ContentRendererProps) {
  const renderNode = useCallback((node: any) => {
    switch (node.type) {
      case 'doc':
        return <div>{node.content.map(renderNode)}</div>;
        
      case 'paragraph':
        return <p>{node.content?.map(renderNode)}</p>;
        
      case 'heading':
        const HeadingTag = `h${node.attrs.level}` as keyof JSX.IntrinsicElements;
        return <HeadingTag>{node.content?.map(renderNode)}</HeadingTag>;
        
      case 'text':
        return node.text;
        
      case 'mention':
        return (
          <a 
            href={`https://x.com/${node.attrs.username}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-black text-white px-2 py-0.5 rounded-md"
          >
            @{node.attrs.username}
          </a>
        );
        
      case 'pageLink':
        return (
          <Link
            href={`/${node.attrs.slug}`}
            className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md"
          >
            [{node.attrs.slug}]
          </Link>
        );
        
      case 'image':
        return <img src={node.attrs.src} alt={node.attrs.alt || ''} />;
        
      case 'youtube':
        return (
          <iframe
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${node.attrs.src}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        );
        
      case 'bulletList':
        return <ul>{node.content?.map(renderNode)}</ul>;
        
      case 'orderedList':
        return <ol>{node.content?.map(renderNode)}</ol>;
        
      case 'listItem':
        return <li>{node.content?.map(renderNode)}</li>;
        
      case 'hardBreak':
        return <br />;
        
      default:
        console.warn('Unhandled node type:', node.type);
        return null;
    }
  }, []);

  if (!content) return null;
  
  return <div className="prose max-w-full">{renderNode(content)}</div>;
} 