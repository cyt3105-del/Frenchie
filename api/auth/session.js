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

export default async function handler(request) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Bearer token required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.slice("Bearer ".length).trim();

    // Authenticate using the token
    const user = await sdk.authenticateToken(token);

    // Set cookie for this domain
    const cookieValue = `frenchie-session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(365 * 24 * 60 * 60)}`;

    return new Response(
      JSON.stringify({ success: true, user: buildUserResponse(user) }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookieValue,
        },
      }
    );
  } catch (error) {
    console.error("[Auth] /api/auth/session failed:", error);
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const config = {
  runtime: "edge",
};
