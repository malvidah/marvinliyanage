import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
  // Rest of your existing code
} 