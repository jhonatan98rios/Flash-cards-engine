import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  isDue,
  newItemVisualizationDate,
  nextInterval,
  toISODate,
} from "./scheduling.ts";

describe("scheduling", () => {
  it("formats dates as YYYY-MM-DD", () => {
    assert.equal(toISODate(new Date(2026, 0, 5)), "2026-01-05");
  });

  it("addDays crosses month boundaries", () => {
    assert.equal(addDays("2026-01-31", 1), "2026-02-01");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  });

  it("nextInterval: again resets to 1, good doubles, easy quadruples", () => {
    assert.equal(nextInterval(0, "again"), 1);
    assert.equal(nextInterval(8, "again"), 1);
    assert.equal(nextInterval(0, "good"), 1);
    assert.equal(nextInterval(1, "good"), 2);
    assert.equal(nextInterval(4, "good"), 8);
    assert.equal(nextInterval(0, "easy"), 4);
    assert.equal(nextInterval(2, "easy"), 8);
  });

  it("caps the interval at 90 days", () => {
    assert.equal(nextInterval(45, "good"), 90);
    assert.equal(nextInterval(30, "easy"), 90);
  });

  it("new items are due tomorrow, not today", () => {
    const tomorrow = addDays(toISODate(new Date()), 1);
    assert.equal(newItemVisualizationDate(), tomorrow);
  });

  it("isDue compares lexicographically (date-only)", () => {
    assert.equal(isDue("2026-01-01", "2026-01-01"), true);
    assert.equal(isDue("2026-01-02", "2026-01-01"), false);
  });
});
