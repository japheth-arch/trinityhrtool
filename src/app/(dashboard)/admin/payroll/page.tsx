import { requireRole } from "@/lib/auth/helpers";

export default async function PayrollPage() {
  await requireRole("hr_admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[26px] leading-tight text-gray-900">Payroll</h1>
        <p className="text-gray-600">
          Salaries and benefits will be computed here, and payslips will be
          generated from each payroll run.
        </p>
      </div>
    </div>
  );
}
