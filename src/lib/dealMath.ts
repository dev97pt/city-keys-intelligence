export interface DealInputs {
  price: number; renovation: number; monthlyRent: number;
  costRate: number;        // annual operating costs as % of total investment
  acquisitionTax: number;  // % of price (IMT + stamp duty, est.)
  ltv: number;             // loan-to-value %, 0 = cash purchase
  interest: number;        // annual %
  years: number;
}

export function computeDeal(i: DealInputs) {
  const taxes = i.price * (i.acquisitionTax / 100);
  const totalInvestment = i.price + i.renovation + taxes;
  const loan = i.price * (i.ltv / 100);
  const cashInvested = totalInvestment - loan;
  const r = i.interest / 100 / 12;
  const n = i.years * 12;
  const mortgage = loan > 0 && n > 0 ? (r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n))) : 0;
  const annualRent = i.monthlyRent * 12;
  const annualCosts = totalInvestment * (i.costRate / 100);
  const monthlyCashFlow = i.monthlyRent - annualCosts / 12 - mortgage;
  const grossYield = totalInvestment > 0 ? (annualRent / totalInvestment) * 100 : 0;
  const roi = cashInvested > 0 ? ((monthlyCashFlow * 12) / cashInvested) * 100 : 0;
  return { taxes, totalInvestment, loan, cashInvested, mortgage, annualRent, annualCosts, monthlyCashFlow, grossYield, roi };
}
