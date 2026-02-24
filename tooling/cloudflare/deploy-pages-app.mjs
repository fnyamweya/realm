import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

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

function buildPagesProjectName(appName, environment) {
    return `realm-${appName}-${environment}`;
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
    const app = `${args.app ?? ""}`.trim();
    const environment = `${args.environment ?? "production"}`;
    const branch = `${args.branch ?? "main"}`;

    if (!app) {
        throw new Error("Missing required argument: --app");
    }

    const appDir = path.resolve(`apps/${app}`);
    if (!existsSync(appDir)) {
        throw new Error(`Application directory not found: ${appDir}`);
    }

    const packageName = `@realtyos/${app}`;
    const projectName = buildPagesProjectName(app, environment);

    console.log(`Building ${packageName} with Next.js...`);
    await run("pnpm", ["--filter", packageName, "build"]);

    console.log(`Converting ${packageName} output for Cloudflare Pages...`);
    await run("pnpm", ["dlx", "@cloudflare/next-on-pages@1.13.16"], {
        cwd: appDir,
        env: {
            ...process.env,
            NEXT_TELEMETRY_DISABLED: "1",
        },
    });

    console.log(`Deploying ${packageName} to Pages project ${projectName}...`);
    const deployStartedAt = Date.now();
    await run("pnpm", [
        "dlx",
        "wrangler@4.31.0",
        "pages",
        "deploy",
        ".vercel/output/static",
        "--project-name",
        projectName,
        "--branch",
        branch,
        "--commit-dirty=true",
    ], {
        cwd: appDir,
    });

    console.log(`Verifying deployment state for ${projectName}...`);
    await run("node", [
        "tooling/cloudflare/verify-pages-deployment.mjs",
        "--project",
        projectName,
        "--environment",
        branch === "main" ? "production" : "preview",
        "--timeout-seconds",
        "900",
        "--created-after-epoch-ms",
        `${deployStartedAt}`,
    ]);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
