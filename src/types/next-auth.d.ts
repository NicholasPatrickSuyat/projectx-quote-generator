import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/types/user";

declare module "next-auth" {
  interface Session {
    error?: "SessionInvalid";
    user: {
      id: string;
      email: string;
      fullName: string;
      role: UserRole;
      companyId: string;
      authVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    companyId: string;
    authVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    companyId?: string;
    fullName?: string;
    authVersion?: number;
    authCheckedAt?: number;
    error?: "SessionInvalid";
  }
}
