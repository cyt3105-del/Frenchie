export default function handler(request) {
  return new Response(
    JSON.stringify({
      ok: true,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || "development"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export const config = {
  runtime: "edge",
};
