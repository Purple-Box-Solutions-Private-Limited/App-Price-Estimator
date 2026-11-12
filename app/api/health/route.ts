export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ai: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
  });
}
