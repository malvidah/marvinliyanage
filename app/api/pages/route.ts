import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth-options";

export async function POST(request: Request) {
  // Get user session
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and admin
  if (!session || !session.user?.isAdmin) {
    return new Response(JSON.stringify({ 
      error: "Unauthorized. Only administrators can create pages." 
    }), { 
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Proceed with page creation...
  try {
    const body = await request.json();
    // Your code to create pages
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to create page" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
} 