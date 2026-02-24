function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) continue;

    const key = token.slice(2);
    const maybeValue = args[index + 1];
    if (!maybeValue || maybeValue.startsWith("--")) {
      result[key] = true;
      continue;
    }

    result[key] = maybeValue;
    index += 1;
  }

  return result;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs();
  const url = `${args.url ?? ""}`.trim();
  const timeoutSeconds = Number(args["timeout-seconds"] ?? 300);
  const pollIntervalMs = Number(args["poll-interval-ms"] ?? 5000);

  if (!url) {
    throw new Error("Missing required argument: --url");
  }

  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutSeconds * 1000) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json,text/html,*/*",
        },
      });

      if (response.ok) {
        console.log(`Endpoint is healthy: ${url} (status ${response.status})`);
        return;
      }

      console.log(`Waiting for endpoint readiness: ${url} (status ${response.status})`);
    } catch (error) {
      console.log(`Waiting for endpoint readiness: ${url} (${error instanceof Error ? error.message : String(error)})`);
    }

    await sleep(pollIntervalMs);
  }

  throw new Error(`Timed out waiting for endpoint readiness: ${url}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
