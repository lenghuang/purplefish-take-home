import { validateSalary, negotiateSalary } from "../agent/salaryTools";

describe("Salary Tools", () => {
  test("validateSalary should return correct validation message", async () => {
    expect(await validateSalary.run({ desiredSalary: 40000 })).toBe(
      "The desired salary is below the role's band."
    );
    expect(await validateSalary.run({ desiredSalary: 75000 })).toBe(
      "The desired salary is within the role's band."
    );
    expect(await validateSalary.run({ desiredSalary: 120000 })).toBe(
      "The desired salary is above the role's band."
    );
  });

  test("negotiateSalary should return negotiation tips", async () => {
    const targetSalary = 85000;
    const expectedMessage = `To negotiate a salary of ${targetSalary}, consider highlighting your unique skills and experiences, and be prepared to discuss market rates.`;
    expect(await negotiateSalary.run({ targetSalary })).toBe(expectedMessage);
  });
});
