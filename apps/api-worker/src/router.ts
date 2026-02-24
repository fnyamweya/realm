import type { Env } from "./env.js";
import type { RequestContext } from "@realtyos/http";

export type RouteHandler = (
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
) => Promise<Response>;

export interface Route {
  method: string;
  pattern: URLPattern;
  handler: RouteHandler;
}

export class Router {
  private readonly routes: Route[] = [];

  add(method: string, pathname: string, handler: RouteHandler): void {
    this.routes.push({
      method,
      pattern: new URLPattern({ pathname }),
      handler,
    });
  }

  get(pathname: string, handler: RouteHandler): void {
    this.add("GET", pathname, handler);
  }

  post(pathname: string, handler: RouteHandler): void {
    this.add("POST", pathname, handler);
  }

  patch(pathname: string, handler: RouteHandler): void {
    this.add("PATCH", pathname, handler);
  }

  put(pathname: string, handler: RouteHandler): void {
    this.add("PUT", pathname, handler);
  }

  delete(pathname: string, handler: RouteHandler): void {
    this.add("DELETE", pathname, handler);
  }

  match(
    method: string,
    url: string,
  ): { handler: RouteHandler; params: Record<string, string> } | undefined {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const result = route.pattern.exec(url);
      if (result) {
        const groups = result.pathname.groups;
        const params: Record<string, string> = {};
        for (const [key, value] of Object.entries(groups)) {
          if (value !== undefined) {
            params[key] = value;
          }
        }
        return { handler: route.handler, params };
      }
    }
    return undefined;
  }
}
