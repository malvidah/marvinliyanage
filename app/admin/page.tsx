'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import getSupabaseBrowser from '@/lib/supabase-browser'
import Layout from '@/components/Layout'
import * as d3 from 'd3'
import { useRouter } from 'next/navigation'
import { deletePages } from '@/lib/page-utils'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [pages, setPages] = useState([])
  const [orphanedPages, setOrphanedPages] = useState([])
  const [selectedNodes, setSelectedNodes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const router = useRouter()
  const isAdmin = status === 'authenticated'
  
  // Load data once on mount
  useEffect(() => {
    loadPages()
  }, [])
  
  // Load pages function - optimized for speed
  const loadPages = async () => {
    setIsLoading(true)
    setMessage("Loading pages...")
    
    try {
      // Single query to get all pages
      const { data: allPages, error } = await getSupabaseBrowser()
        .from('pages')
        .select('id, slug, title, content')
      
      if (error) {
        console.error("Database error:", error)
        setMessage("Error loading pages")
        return
      }
      
      if (!allPages || allPages.length === 0) {
        setMessage("No pages found")
        setPages([])
        setOrphanedPages([])
        return
      }
      
      setMessage(`Found ${allPages.length} pages`)
      console.log("Pages loaded:", allPages.length)
      
      // Process data in memory to find orphaned pages
      const orphaned = []
      const slugMap = new Map()
      
      // First pass - build slug map
      allPages.forEach(page => {
        slugMap.set(page.slug, {
          ...page,
          outLinks: [],
          inLinks: []
        })
      })
      
      // Second pass - record connections
      allPages.forEach(page => {
        const links = extractPageLinks(page.content)
        
        links.forEach(targetSlug => {
          if (slugMap.has(page.slug)) {
            slugMap.get(page.slug).outLinks.push(targetSlug)
          }
          
          if (slugMap.has(targetSlug)) {
            slugMap.get(targetSlug).inLinks.push(page.slug)
          }
        })
      })
      
      // Find orphaned pages
      slugMap.forEach((data) => {
        if (data.inLinks.length === 0 && data.outLinks.length === 0) {
          orphaned.push(data.id)
        }
      })
      
      setPages(allPages)
      setOrphanedPages(orphaned)
      setMessage("")
      
      console.log("Orphaned pages:", orphaned.length)
      
      // Render graph after a tiny delay to ensure DOM is ready
      setTimeout(() => renderGraph(allPages, orphaned), 100)
      
    } catch (error) {
      console.error('Error loading pages:', error)
      setMessage("Error processing pages")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Delete selected pages
  const deleteSelectedPages = async () => {
    if (!selectedNodes.length) return
    
    if (!confirm(`Delete ${selectedNodes.length} selected page(s)?`)) {
      return
    }
    
    try {
      setMessage(`Deleting ${selectedNodes.length} pages...`)
      
      for (const pageId of selectedNodes) {
        await getSupabaseBrowser()
          .from('pages')
          .delete()
          .eq('id', pageId)
      }
      
      // Reset selection and reload
      setSelectedNodes([])
      setMessage("Pages deleted. Refreshing...")
      loadPages()
    } catch (error) {
      console.error('Error deleting pages:', error)
      setMessage("Error deleting pages")
    }
  }
  
  // Extract page links
  function extractPageLinks(content) {
    if (!content) return []
    const linkRegex = /\[([^\]]+)\]/g
    const matches = []
    let match
    while ((match = linkRegex.exec(content)) !== null) {
      matches.push(match[1])
    }
    return [...new Set(matches)]
  }
  
  // Optimized D3 graph render function
  function renderGraph(pages, orphanedPages) {
    if (!svgRef.current || !containerRef.current) {
      console.error("SVG or container ref not available")
      return
    }
    
    console.log("Rendering graph with", pages.length, "pages")
    
    // Calculate available space (accounting for margins)
    const containerRect = containerRef.current.getBoundingClientRect()
    const width = containerRect.width - 40 // 20px margin on each side
    const height = containerRect.height - 40
    
    console.log("Graph dimensions:", width, "x", height)
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
    
    svg.selectAll('*').remove()
    
    // Create nodes and links
    const nodes = pages.map(page => ({
      id: page.id,
      title: page.title || page.slug,
      slug: page.slug,
      isOrphaned: orphanedPages.includes(page.id),
      isSelected: selectedNodes.includes(page.id)
    }))
    
    const links = []
    const pageMap = new Map(pages.map(page => [page.slug, page]))
    
    // Build links efficiently
    pages.forEach(page => {
      const outLinks = extractPageLinks(page.content)
      outLinks.forEach(targetSlug => {
        const targetPage = pageMap.get(targetSlug)
        if (targetPage) {
          links.push({
            source: page.id,
            target: targetPage.id
          })
        }
      })
    })
    
    console.log("Graph data:", nodes.length, "nodes,", links.length, "links")
    
    // Optimized force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.12))
      .force('y', d3.forceY(height / 2).strength(0.12))
      .force('collide', d3.forceCollide().radius(30))
    
    // Draw links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#e9d5ff') // Light purple (tailwind purple-200)
      .attr('stroke-width', 2)
    
    // Draw nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragStart)
        .on('drag', dragging)
        .on('end', dragEnd))
      .on('click', (event, d) => {
        // Admin can select nodes
        if (isAdmin) {
          event.stopPropagation();
          
          // Update selection state
          const isCurrentlySelected = selectedNodes.includes(d.id);
          
          // Update the visual appearance immediately
          d3.select(event.currentTarget)
            .select('circle')
            .attr('fill', isCurrentlySelected ? 
              (d.isOrphaned ? '#c4b5fd' : '#6366f1') : // If deselecting, revert to original color
              '#fca5a5') // If selecting, set to selected color
            .attr('stroke', isCurrentlySelected ? 'transparent' : '#b91c1c')
            .attr('stroke-width', isCurrentlySelected ? 0 : 3);
          
          // Then update the React state
          setSelectedNodes(prev => {
            if (isCurrentlySelected) {
              return prev.filter(id => id !== d.id);
            } else {
              return [...prev, d.id];
            }
          });
        } else {
          // Navigate to page when non-admin clicks
          router.push(`/${d.slug}`);
        }
      })
      .on('dblclick', (event, d) => {
        // Double click always navigates to page
        router.push(`/${d.slug}`)
      })
    
    // Add circles for nodes
    node.append('circle')
      .attr('r', 15)
      .attr('fill', d => {
        if (d.isSelected) return '#fca5a5' // Brighter light red for selected (red-300)
        if (d.isOrphaned) return '#c4b5fd' // Light purple for orphaned (purple-300)
        return '#6366f1' // Indigo for regular
      })
      .attr('stroke', d => d.isSelected ? '#b91c1c' : 'transparent') // Deeper red border (red-700)
      .attr('stroke-width', d => d.isSelected ? 3 : 0) // Thicker border
      .attr('cursor', 'pointer')
    
    // Add text labels
    node.append('text')
      .text(d => d.title)
      .attr('dy', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#000')
      .attr('pointer-events', 'none')
    
    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
      
      node
        .attr('transform', d => {
          const x = Math.max(30, Math.min(width - 30, d.x))
          const y = Math.max(30, Math.min(height - 30, d.y))
          return `translate(${x}, ${y})`
        })
    })
    
    // Simple drag functions - just for moving nodes around
    function dragStart(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }
    
    function dragging(event, d) {
      d.fx = event.x
      d.fy = event.y
    }
    
    function dragEnd(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }
    
    // Stop simulation after a delay for performance
    setTimeout(() => {
      simulation.alphaTarget(0).alpha(0).stop()
    }, 3000)
  }
  
  // Add a useEffect to update node colors when selection changes
  useEffect(() => {
    if (!svgRef.current || isLoading || pages.length === 0) return;
    
    // Update colors of existing nodes based on selection state
    d3.select(svgRef.current)
      .selectAll('circle')
      .data(pages.map(page => ({
        id: page.id,
        isSelected: selectedNodes.includes(page.id),
        isOrphaned: orphanedPages.includes(page.id)
      })), d => d.id)
      .attr('fill', d => {
        if (d.isSelected) return '#fca5a5' // Brighter light red for selected (red-300)
        if (d.isOrphaned) return '#c4b5fd' // Light purple for orphaned (purple-300)
        return '#6366f1' // Indigo for regular
      })
      .attr('stroke', d => d.isSelected ? '#b91c1c' : 'transparent')
      .attr('stroke-width', d => d.isSelected ? 3 : 0);
  }, [selectedNodes, orphanedPages, isLoading, pages]);
  
  // Render page UI
  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-130px)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-archivo font-bold">Admin</h1>
          
          <div className="flex items-center gap-4">
            {selectedNodes.length > 0 && isAdmin && (
              <button
                onClick={deleteSelectedPages}
                className="px-4 py-2 bg-red-50 text-red-700 rounded font-archivo"
              >
                Delete {selectedNodes.length} selected
              </button>
            )}
            
            {!isAdmin && (
              <button
                onClick={() => signIn('google')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm font-archivo hover:bg-gray-50 transition"
              >
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Sign in with Google
              </button>
            )}
            
            {isAdmin && (
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded font-archivo hover:bg-gray-200 transition"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
        
        {/* Status message */}
        {message && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-center">
            {message}
          </div>
        )}
        
        {/* Graph container - ensure it fits in viewport */}
        <div 
          ref={containerRef}
          className="flex-grow bg-purple-100 rounded-md overflow-hidden relative"
          style={{ maxHeight: 'calc(100vh - 180px)' }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-purple-700">Loading...</p>
            </div>
          ) : (
            <svg
              ref={svgRef}
              className="w-full h-full"
              style={{ background: '#F3E8FF' }}
            />
          )}
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-75 p-2 rounded text-xs">
            <div className="flex items-center mb-1">
              <span className="w-3 h-3 rounded-full bg-indigo-500 mr-1"></span>
              <span>Regular Pages</span>
            </div>
            <div className="flex items-center mb-1">
              <span className="w-3 h-3 rounded-full bg-purple-300 mr-1"></span>
              <span>Orphaned Pages</span>
            </div>
            {isAdmin && (
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-400 mr-1 border border-red-800"></span>
                <span>Selected Pages</span>
              </div>
            )}
          </div>
          
          {/* Instructions for admins */}
          {isAdmin && (
            <div className="absolute top-4 right-4 bg-white bg-opacity-75 p-2 rounded text-xs max-w-xs">
              <p>Click a page to select/deselect</p>
              <p>Double-click to view page</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
} 