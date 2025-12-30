import "dotenv/config";
import { getUserByOpenId, upsertUser } from "../../server/db.js";
import { sdk } from "../../server/_core/sdk.js";
import { ONE_YEAR_MS } from "../../shared/const.js";

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
    const user = await syncUser(userInfo);

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    return new Response(
      JSON.stringify({
        app_session_id: sessionToken,
        user: buildUserResponse(user),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[OAuth] Mobile exchange failed", error);
    return new Response(
      JSON.stringify({ error: "OAuth mobile exchange failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const config = {
  runtime: "edge",
};
