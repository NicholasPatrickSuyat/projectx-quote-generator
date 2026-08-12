import { handlers } from "@/auth";
import { getAuthMode } from "@/lib/auth/mode";
import type { NextRequest } from "next/server";

async function guard(request: NextRequest, method: "GET" | "POST") {
  if (getAuthMode() !== "production") {
    return new Response("Authentication API is unavailable in AUTH_MODE=demo.", {
      status: 404,
    });
  }
  return method === "GET" ? handlers.GET(request) : handlers.POST(request);
}

export async function GET(request: NextRequest) {
  return guard(request, "GET");
}

export async function POST(request: NextRequest) {
  return guard(request, "POST");
}
