import { createCloudflareClient } from "./lib/cloudflare-api.mjs";

const DEFAULT_APPS = [
    "web-landing",
    "web-console",
    "web-resident",
    "web-command",
    "web-listings",
];

const VALID_R2_LOCATIONS = new Set([
    "wnam",
    "enam",
    "weur",
    "eeur",
    "apac",
    "oc",
    "auto",
]);

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

function splitCsv(value) {
    if (!value) return [];
    return value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
}

function resolveR2Location(rawLocation) {
    const normalized = `${rawLocation ?? ""}`.trim().toLowerCase();
    const fallback = "wnam";

    if (!normalized) {
        return fallback;
    }

    if (!VALID_R2_LOCATIONS.has(normalized)) {
        const validValues = Array.from(VALID_R2_LOCATIONS).join(", ");
        throw new Error(
            `Invalid CLOUDFLARE_R2_LOCATION: '${rawLocation}'. Valid values: ${validValues}`,
        );
    }

    return normalized;
}

function appSubdomain(appName) {
    if (appName === "web-landing") return "www";
    return appName.replace(/^web-/, "");
}

function buildPagesProjectName(appName, environment) {
    return `realm-${appName}-${environment}`;
}

function buildApiWorkerName(environment) {
    return `realm-api-${environment}`;
}

async function ensurePagesProject(cf, projectName) {
    const projects = await cf.paginate(
        `/accounts/${cf.accountId}/pages/projects`,
        (data) => data?.result,
    );

    const existing = projects.find((project) => project.name === projectName);
    if (existing) {
        return { name: projectName, created: false };
    }

    await cf.request(`/accounts/${cf.accountId}/pages/projects`, {
        method: "POST",
        body: {
            name: projectName,
            production_branch: "main",
        },
    });

    return { name: projectName, created: true };
}

async function ensureCustomDomain(cf, projectName, domainName) {
    const domains = await cf.request(
        `/accounts/${cf.accountId}/pages/projects/${projectName}/domains`,
    );

    const exists = domains?.result?.some((entry) => entry.name === domainName);
    if (exists) {
        return { name: domainName, created: false };
    }

    await cf.request(
        `/accounts/${cf.accountId}/pages/projects/${projectName}/domains`,
        {
            method: "POST",
            body: { name: domainName },
        },
    );

    return { name: domainName, created: true };
}

async function getWorkersSubdomain(cf) {
    const response = await cf.request(
        `/accounts/${cf.accountId}/workers/subdomain`,
    );

    const subdomain = response?.result?.subdomain;
    if (!subdomain) {
        throw new Error(
            "Unable to resolve workers.dev subdomain for account. Set CLOUDFLARE_WORKERS_SUBDOMAIN explicitly.",
        );
    }

    return `${subdomain}`;
}

async function ensureDnsCname(cf, zoneId, name, content) {
    const records = await cf.request(
        `/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(name)}`,
    );

    const existing = records?.result?.[0];

    if (!existing) {
        const created = await cf.request(`/zones/${zoneId}/dns_records`, {
            method: "POST",
            body: {
                type: "CNAME",
                name,
                content,
                ttl: 1,
                proxied: true,
            },
        });

        return { id: created?.result?.id, created: true, updated: false };
    }

    if (existing.content === content && existing.proxied) {
        return { id: existing.id, created: false, updated: false };
    }

    const updated = await cf.request(`/zones/${zoneId}/dns_records/${existing.id}`, {
        method: "PUT",
        body: {
            type: "CNAME",
            name,
            content,
            ttl: 1,
            proxied: true,
        },
    });

    return { id: updated?.result?.id, created: false, updated: true };
}

async function ensureD1Database(cf, dbName) {
    const databases = await cf.paginate(
        `/accounts/${cf.accountId}/d1/database`,
        (data) => data?.result,
    );

    const existing = databases.find((db) => db.name === dbName);
    if (existing) {
        return { name: dbName, id: existing.uuid, created: false };
    }

    const created = await cf.request(`/accounts/${cf.accountId}/d1/database`, {
        method: "POST",
        body: { name: dbName },
    });

    return { name: dbName, id: created?.result?.uuid, created: true };
}

async function ensureQueue(cf, queueName) {
    const queues = await cf.paginate(
        `/accounts/${cf.accountId}/queues`,
        (data) => data?.result,
    );

    const existing = queues.find((queue) => queue.queue_name === queueName);
    if (existing) {
        return { name: queueName, created: false };
    }

    await cf.request(`/accounts/${cf.accountId}/queues`, {
        method: "POST",
        body: { queue_name: queueName },
    });

    return { name: queueName, created: true };
}

async function ensureR2Bucket(cf, bucketName, location) {
    const buckets = await cf.paginate(
        `/accounts/${cf.accountId}/r2/buckets`,
        (data) => data?.result?.buckets,
    );

    const existing = buckets.find((bucket) => bucket.name === bucketName);
    if (existing) {
        return { name: bucketName, created: false };
    }

    await cf.request(`/accounts/${cf.accountId}/r2/buckets`, {
        method: "POST",
        body: {
            name: bucketName,
            locationHint: location,
        },
    });

    return { name: bucketName, created: true };
}

async function ensureKvNamespace(cf, namespaceTitle) {
    const namespaces = await cf.paginate(
        `/accounts/${cf.accountId}/storage/kv/namespaces`,
        (data) => data?.result,
    );

    const existing = namespaces.find((namespace) => namespace.title === namespaceTitle);
    if (existing) {
        return { title: namespaceTitle, id: existing.id, created: false };
    }

    const created = await cf.request(`/accounts/${cf.accountId}/storage/kv/namespaces`, {
        method: "POST",
        body: { title: namespaceTitle },
    });

    return { title: namespaceTitle, id: created?.result?.id, created: true };
}

async function main() {
    const args = parseArgs();
    const environment = `${args.environment ?? "production"}`;
    const apps = splitCsv(args.apps).length > 0 ? splitCsv(args.apps) : DEFAULT_APPS;

    const rootDomain = process.env.CLOUDFLARE_ROOT_DOMAIN;
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;

    const d1Databases = splitCsv(process.env.CF_D1_DATABASES);
    const queueNames = splitCsv(process.env.CF_QUEUES);
    const r2Buckets = splitCsv(process.env.CF_R2_BUCKETS);
    const kvNamespaces = splitCsv(process.env.CF_KV_NAMESPACES);

    const d1Targets = d1Databases.length > 0 ? d1Databases : [`realm-core-${environment}`];
    const queueTargets = queueNames.length > 0 ? queueNames : [`realm-jobs-${environment}`, `realm-events-${environment}`];
    const r2Targets = r2Buckets.length > 0 ? r2Buckets : [`realm-assets-${environment}`];
    const kvTargets = kvNamespaces.length > 0 ? kvNamespaces : [`realm-cache-${environment}`];

    const r2Location = resolveR2Location(process.env.CLOUDFLARE_R2_LOCATION);
    const apiSubdomain = `${process.env.CLOUDFLARE_API_SUBDOMAIN ?? "api"}`
        .trim()
        .toLowerCase();
    const workerSubdomainFromEnv = `${process.env.CLOUDFLARE_WORKERS_SUBDOMAIN ?? ""}`
        .trim()
        .toLowerCase();

    const cf = createCloudflareClient();

    const summary = {
        environment,
        pagesProjects: [],
        customDomains: [],
        dnsRecords: [],
        d1Databases: [],
        queues: [],
        r2Buckets: [],
        kvNamespaces: [],
        apiDnsRecords: [],
    };

    for (const app of apps) {
        const projectName = buildPagesProjectName(app, environment);
        const projectResult = await ensurePagesProject(cf, projectName);
        summary.pagesProjects.push(projectResult);

        if (rootDomain) {
            const domainName = `${appSubdomain(app)}.${rootDomain}`;
            const domainResult = await ensureCustomDomain(cf, projectName, domainName);
            summary.customDomains.push({ projectName, ...domainResult });

            if (zoneId) {
                const dnsResult = await ensureDnsCname(
                    cf,
                    zoneId,
                    domainName,
                    `${projectName}.pages.dev`,
                );
                summary.dnsRecords.push({ name: domainName, ...dnsResult });
            }
        }
    }

    if (rootDomain && zoneId) {
        const apiDomainName = `${apiSubdomain}.${rootDomain}`;
        const apiWorkerName = buildApiWorkerName(environment);
        const workersSubdomain = workerSubdomainFromEnv || await getWorkersSubdomain(cf);
        const workersHostname = `${apiWorkerName}.${workersSubdomain}.workers.dev`;

        const apiDnsResult = await ensureDnsCname(
            cf,
            zoneId,
            apiDomainName,
            workersHostname,
        );

        summary.apiDnsRecords.push({
            name: apiDomainName,
            target: workersHostname,
            ...apiDnsResult,
        });
    }

    for (const dbName of d1Targets) {
        summary.d1Databases.push(await ensureD1Database(cf, dbName));
    }

    for (const queueName of queueTargets) {
        summary.queues.push(await ensureQueue(cf, queueName));
    }

    for (const bucketName of r2Targets) {
        summary.r2Buckets.push(await ensureR2Bucket(cf, bucketName, r2Location));
    }

    for (const namespaceTitle of kvTargets) {
        summary.kvNamespaces.push(await ensureKvNamespace(cf, namespaceTitle));
    }

    console.log("Cloudflare infrastructure provisioning summary:");
    console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
