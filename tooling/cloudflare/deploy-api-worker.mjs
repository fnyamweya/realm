import { spawn } from "node:child_process";

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

function buildApiWorkerName(environment) {
  return `realm-api-${environment}`;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      ...options,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Command failed: ${command} ${args.join(" ")} (exit ${code})`));
    });
  });
}

async function main() {
  const args = parseArgs();
  const environment = `${args.environment ?? "production"}`;
  const branch = `${args.branch ?? "main"}`;
  const workerName = buildApiWorkerName(environment);
  const workerSubdomain = `${process.env.CLOUDFLARE_WORKERS_SUBDOMAIN ?? ""}`
    .trim()
    .toLowerCase();
  const rootDomain = `${process.env.CLOUDFLARE_ROOT_DOMAIN ?? ""}`.trim().toLowerCase();
  const apiSubdomain = `${process.env.CLOUDFLARE_API_SUBDOMAIN ?? "api"}`.trim().toLowerCase();

  console.log("Building API contract dependencies...");
  await run("pnpm", ["--filter", "@realtyos/contracts-api...", "build"]);

  console.log(`Deploying API worker ${workerName}...`);
  await run("pnpm", [
    "dlx",
    "wrangler@4.31.0",
    "deploy",
    "--config",
    "apps/api-worker/wrangler.toml",
    "--name",
    workerName,
    "--var",
    `DEPLOY_ENV:${environment}`,
    "--var",
    `GIT_BRANCH:${branch}`,
  ]);

  let baseUrl = "";
  if (rootDomain) {
    baseUrl = `https://${apiSubdomain}.${rootDomain}`;
  } else if (workerSubdomain) {
    baseUrl = `https://${workerName}.${workerSubdomain}.workers.dev`;
  }

  if (!baseUrl) {
    console.log(
      "Skipping HTTP verification because neither CLOUDFLARE_ROOT_DOMAIN nor CLOUDFLARE_WORKERS_SUBDOMAIN is configured.",
    );
    return;
  }

  console.log(`Verifying API health at ${baseUrl}/health`);
  await run("node", [
    "tooling/cloudflare/verify-http-endpoint.mjs",
    "--url",
    `${baseUrl}/health`,
    "--timeout-seconds",
    "600",
  ]);

  console.log(`Verifying Swagger docs at ${baseUrl}/docs`);
  await run("node", [
    "tooling/cloudflare/verify-http-endpoint.mjs",
    "--url",
    `${baseUrl}/docs`,
    "--timeout-seconds",
    "600",
  ]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
