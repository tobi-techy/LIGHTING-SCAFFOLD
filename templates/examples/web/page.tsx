import Link from "next/link";

export default function Examples() {
  const examples = [
    { href: "/examples/passkey-login", title: "Passkey Login", desc: "WebAuthn-based authentication" },
    { href: "/examples/gasless-transfer", title: "Gasless Transfer", desc: "Send SOL without gas fees" },
    { href: "/examples/biometric-onboard", title: "Biometric Onboarding", desc: "Secure wallet setup flow" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-2">LazorKit Examples</h1>
      <p className="text-gray-500 mb-8">Explore the SDK integration demos</p>

      <div className="grid gap-4 w-full max-w-md">
        {examples.map((ex) => (
          <Link key={ex.href} href={ex.href} className="block p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition">
            <h2 className="font-semibold">{ex.title}</h2>
            <p className="text-sm text-gray-500">{ex.desc}</p>
          </Link>
        ))}
      </div>

      <Link href="/" className="text-blue-600 mt-8">← Back to Home</Link>
    </div>
  );
}
