export async function GET() {
  return Response.json({ status: "healthy", timestamp: Date.now() }, { status: 200 });
}
