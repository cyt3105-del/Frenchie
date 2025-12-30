import "dotenv/config";
import { getUserByOpenId, upsertUser } from "../../server/db.js";
import { getSessionCookieOptions } from "../../server/_core/cookies.js";
import { sdk } from "../../server/_core/sdk.js";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";

function getQueryParam(url, key) {
  const urlObj = new URL(url);
  return urlObj.searchParams.get(key);
}

async function syncUser(userInfo) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }

  const lastSignedIn = new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn,
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return (
    saved ?? {
      openId: userInfo.openId,
      name: userInfo.name,
      email: userInfo.email,
      loginMethod: userInfo.loginMethod ?? null,
      lastSignedIn,
    }
  );
}

export default async function handler(request) {
  const code = getQueryParam(request.url, "code");
  const state = getQueryParam(request.url, "state");

  if (!code || !state) {
    return new Response(
      JSON.stringify({ error: "code and state are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
    await syncUser(userInfo);
    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    // For Vercel, we'll redirect to the frontend with the token in the URL
    // since we can't set cookies in serverless functions the same way
    const frontendUrl = process.env.EXPO_WEB_PREVIEW_URL ||
                       process.env.VERCEL_URL ?
                       `https://${process.env.VERCEL_URL}` :
                       "http://localhost:8081";

    const redirectUrl = `${frontendUrl}?token=${encodeURIComponent(sessionToken)}`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
      },
    });
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return new Response(
      JSON.stringify({ error: "OAuth callback failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const config = {
  runtime: "edge",
};
