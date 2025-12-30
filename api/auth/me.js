import "dotenv/config";
import { sdk } from "../../server/_core/sdk.js";

function buildUserResponse(user) {
  return {
    id: user?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

// Helper to get auth token from request
function getAuthToken(request) {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  // Also check for token in cookies
  const cookie = request.headers.get("cookie");
  if (cookie) {
    const tokenMatch = cookie.match(/frenchie-session=([^;]+)/);
    if (tokenMatch) {
      return decodeURIComponent(tokenMatch[1]);
    }
  }

  return null;
}

export default async function handler(request) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Not authenticated", user: null }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await sdk.authenticateToken(token);
    return new Response(
      JSON.stringify({ user: buildUserResponse(user) }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Auth] /api/auth/me failed:", error);
    return new Response(
      JSON.stringify({ error: "Not authenticated", user: null }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const config = {
  runtime: "edge",
};
