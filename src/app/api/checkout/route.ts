import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { plan?: "single" | "pro"; auditId?: string };
    const plan = body.plan === "pro" ? "pro" : "single";

    const polarSingle = process.env.POLAR_CHECKOUT_URL_SINGLE?.trim();
    const polarPro = process.env.POLAR_CHECKOUT_URL_PRO?.trim();

    const targetUrl = plan === "pro" ? polarPro : polarSingle;

    if (targetUrl) {
      const url = new URL(targetUrl);
      if (body.auditId) {
        url.searchParams.set("metadata[audit_id]", body.auditId);
      }
      return NextResponse.json({
        mode: "live_checkout",
        checkoutUrl: url.toString(),
      });
    }

    // Zero-cost local / preview unlock mode before Polar.sh or Stripe links are configured
    return NextResponse.json({
      mode: "demo_unlock",
      message:
        "No POLAR_CHECKOUT_URL configured yet — unlocked in Preview Mode so you can inspect the full report and record demo clips!",
    });
  } catch {
    return NextResponse.json({ error: "Checkout initialization failed." }, { status: 400 });
  }
}
