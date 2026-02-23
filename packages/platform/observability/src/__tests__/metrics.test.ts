import { describe, it, expect } from "vitest";
import { createCounter, createHistogram } from "../metrics.js";

describe("createCounter", () => {
  it("starts at zero", () => {
    const counter = createCounter("requests");
    expect(counter.getValue()).toBe(0);
  });

  it("increments without labels", () => {
    const counter = createCounter("requests");
    counter.increment();
    counter.increment();
    counter.increment();
    expect(counter.getValue()).toBe(3);
  });

  it("increments independently per label set", () => {
    const counter = createCounter("http_requests");
    counter.increment({ method: "GET" });
    counter.increment({ method: "GET" });
    counter.increment({ method: "POST" });

    expect(counter.getValue({ method: "GET" })).toBe(2);
    expect(counter.getValue({ method: "POST" })).toBe(1);
    expect(counter.getValue({ method: "DELETE" })).toBe(0);
  });

  it("has the correct name", () => {
    const counter = createCounter("my_counter");
    expect(counter.name).toBe("my_counter");
  });
});

describe("createHistogram", () => {
  it("has the correct name", () => {
    const histogram = createHistogram("response_time");
    expect(histogram.name).toBe("response_time");
  });

  it("accepts observations without errors", () => {
    const histogram = createHistogram("response_time");
    histogram.observe(100);
    histogram.observe(200, { route: "/api" });
    histogram.observe(50, { route: "/api" });
  });
});
