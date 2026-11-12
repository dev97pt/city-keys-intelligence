import { describe, it, expect } from "vitest";
import { computeDeal } from "@/lib/dealMath";

const base = { price: 200000, renovation: 0, monthlyRent: 1000, costRate: 4, acquisitionTax: 0, ltv: 0, interest: 0, years: 30 };

describe("computeDeal", () => {
  it("cash deal: 4% running costs deducted from yearly rent", () => {
    const d = computeDeal(base);
    expect(d.grossYield).toBeCloseTo(6);
    expect(d.monthlyCashFlow).toBeCloseTo(1000 - 8000 / 12);
    expect(d.roi).toBeCloseTo(2);
  });
  it("purchase taxes add to total investment", () => {
    expect(computeDeal({ ...base, acquisitionTax: 7 }).totalInvestment).toBe(214000);
  });
  it("mortgage reduces cash invested and adds monthly payment", () => {
    const d = computeDeal({ ...base, ltv: 50, interest: 0, years: 10 });
    expect(d.cashInvested).toBe(100000);
    expect(d.mortgage).toBeCloseTo(100000 / 120);
  });
});
