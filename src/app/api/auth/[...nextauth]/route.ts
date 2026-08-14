import { handlers } from "@/auth";
import { getAuthMode } from "@/lib/auth/mode";
import type { NextRequest } from "next/server";

async function guard(request: NextRequest, method: "GET" | "POST") {
  if (getAuthMode() !== "production") {
    return new Response("Authentication API is unavailable in AUTH_MODE=demo.", {
      status: 404,
    });
  }
  // Fail closed before Auth.js handlers run.
  try {
    const { assertProductionAuthConfigured } = await import("@/lib/auth/mode");
    const { assertDatabaseUrlPresent } = await import("@/lib/persistence/mode");
    assertProductionAuthConfigured();
    assertDatabaseUrlPresent();
  } catch (error) {
    // Public body stays generic — no env names, messages, or stack details.
    console.error(
      "[auth] production auth configuration error — denying Auth.js handlers",
    );
    void error;
    return new Response("Authentication service unavailable.", { status: 500 });
  }
  return method === "GET" ? handlers.GET(request) : handlers.POST(request);
}

export async function GET(request: NextRequest) {
  return guard(request, "GET");
}

export async function POST(request: NextRequest) {
  return guard(request, "POST");
}
