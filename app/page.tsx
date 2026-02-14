import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Find, verify, and prioritize grants faster.</h1>
      <p className="text-slate-600">GrantFinder ingests grants.gov + sbir.gov, verifies eligibility deterministically, and explains fit scoring.</p>
      <div className="space-x-3">
        <Link href="/register" className="px-4 py-2 bg-slate-900 text-white rounded">Create account</Link>
        <Link href="/dashboard" className="px-4 py-2 border rounded">Open dashboard</Link>
      </div>
    </div>
  );
}
