import { createCloudflareClient } from "./lib/cloudflare-api.mjs";

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

function getDeploymentStatus(deployment) {
  const latestStageStatus = deployment?.latest_stage?.status;
  if (latestStageStatus) {
    return `${latestStageStatus}`.toLowerCase();
  }

  const deploymentStatus = deployment?.deployment_trigger?.metadata?.status;
  if (deploymentStatus) {
    return `${deploymentStatus}`.toLowerCase();
  }

  return "unknown";
}

function isSuccess(status) {
  return ["success", "active", "deployed", "healthy"].includes(status);
}

function isFailure(status) {
  return ["failure", "failed", "error", "canceled", "cancelled"].includes(status);
}

function inferEnvironment(deployment) {
  return (
    deployment?.environment ||
    deployment?.deployment_environment ||
    deployment?.env ||
    "unknown"
  );
}

async function main() {
  const args = parseArgs();
  const projectName = `${args.project ?? ""}`.trim();

  if (!projectName) {
    throw new Error("Missing required argument: --project");
  }

  const requestedEnvironment = `${args.environment ?? "production"}`.toLowerCase();
  const timeoutSeconds = Number(args["timeout-seconds"] ?? 600);
  const pollIntervalMs = Number(args["poll-interval-ms"] ?? 10000);
  const createdAfterEpochMs = Number(args["created-after-epoch-ms"] ?? 0);

  const cf = createCloudflareClient();
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutSeconds * 1000) {
    const response = await cf.request(
      `/accounts/${cf.accountId}/pages/projects/${projectName}/deployments`,
    );

    const deployments = Array.isArray(response?.result) ? response.result : [];
    const deployment = deployments.find((item) => {
      if (createdAfterEpochMs > 0 && item?.created_on) {
        const createdAtEpochMs = Date.parse(item.created_on);
        if (!Number.isNaN(createdAtEpochMs) && createdAtEpochMs < createdAfterEpochMs) {
          return false;
        }
      }

      const env = `${inferEnvironment(item)}`.toLowerCase();
      if (requestedEnvironment === "production") {
        return env === "production" || env === "prod" || env === "unknown";
      }
      return env === "preview" || env === requestedEnvironment || env === "unknown";
    });

    if (deployment) {
      const status = getDeploymentStatus(deployment);
      const url = deployment?.url ?? deployment?.aliases?.[0] ?? "(unknown url)";

      console.log(
        JSON.stringify(
          {
            projectName,
            requestedEnvironment,
            deploymentId: deployment.id,
            status,
            url,
            createdOn: deployment.created_on,
          },
          null,
          2,
        ),
      );

      if (isSuccess(status)) {
        console.log(`Deployment for ${projectName} is successful.`);
        return;
      }

      if (isFailure(status)) {
        throw new Error(`Deployment failed for ${projectName} with status: ${status}`);
      }
    } else {
      console.log(`No deployment found yet for ${projectName}; waiting...`);
    }

    await sleep(pollIntervalMs);
  }

  throw new Error(
    `Timed out waiting for deployment confirmation for ${projectName} (${requestedEnvironment}).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
