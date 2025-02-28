import "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string
      email?: string
      image?: string
      isAdmin: boolean
    }
  }
  
  interface User {
    isAdmin?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean
  }
} 