/**
 * Debug route: returns 200 if /api/auth/* reaches this Next.js app.
 * If this 404s, the reverse proxy is routing /api/auth elsewhere.
 */
export async function GET() {
  return Response.json({ ok: true, message: "auth route reachable" }, { status: 200 });
}
