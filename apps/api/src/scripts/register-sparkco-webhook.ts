/**
 * One-time setup: registers our inbound-message endpoint with the SparkCo
 * communication service, so a member's WhatsApp reply gets POSTed to us
 * instead of only sitting in SparkCo's own conversation log. See
 * COMMUNICATION_SERVICE_MANUAL.md ("Webhooks") and
 * apps/api/src/modules/webhooks/sparkco-webhook.controller.ts.
 *
 * SparkCo returns the signing secret exactly once, at creation time — this
 * prints it so you can paste it into SPARKCO_API_KEY's neighbor,
 * SPARKCO_WEBHOOK_SECRET, in apps/api/.env. Re-running this script creates
 * a *second* webhook subscription rather than updating the first one, so
 * only run it once per environment (delete the old one first if replacing).
 *
 * Run with (build first, same as the other one-off scripts in this folder):
 *   pnpm --filter api exec nest build
 *   node --env-file=.env apps/api/dist/scripts/register-sparkco-webhook.js https://gym.sparkco.vip/api/webhooks/sparkco
 */

async function main() {
  const [webhookUrl] = process.argv.slice(2);
  const apiKey = process.env.SPARKCO_API_KEY;
  const baseUrl =
    process.env.SPARKCO_API_URL ?? 'https://api.sparkco.vip/api/v1';

  if (!webhookUrl || !webhookUrl.startsWith('https://')) {
    throw new Error(
      'Usage: register-sparkco-webhook.js https://<domain>/api/webhooks/sparkco',
    );
  }
  if (!apiKey) {
    throw new Error('SPARKCO_API_KEY is not set.');
  }

  const res = await fetch(`${baseUrl}/webhooks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      url: webhookUrl,
      events: ['message.received'],
    }),
  });

  const payload = (await res.json()) as {
    success: boolean;
    data?: { id: string; secret: string };
    error?: string;
  };

  if (!res.ok || !payload.success || !payload.data) {
    throw new Error(
      `SparkCo webhook registration failed: ${payload.error ?? res.statusText}`,
    );
  }

  console.log(`Webhook registered (id: ${payload.data.id}).`);
  console.log('Set this in apps/api/.env, then restart the api container:');
  console.log(`SPARKCO_WEBHOOK_SECRET=${payload.data.secret}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
