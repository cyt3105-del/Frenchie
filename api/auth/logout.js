export default function handler(request) {
  // For serverless functions, we can't directly clear cookies like in Express
  // The frontend should handle clearing local storage/session storage
  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "frenchie-session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=-1"
      },
    }
  );
}

export const config = {
  runtime: "edge",
};
