import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-bold text-blue-400 cursor-pointer hover:text-blue-300">
            InsightForge
          </h1>
        </Link>

          <div className="flex gap-4">
            <Link href="/login">
              <button className="px-4 py-2 border border-slate-700 rounded-lg">
                Login
              </button>
            </Link>

            <Link href="/register">
              <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-28">
        <h1 className="text-6xl font-bold leading-tight max-w-4xl">
          Transform Raw Business Data Into
          <span className="text-blue-400"> AI-Powered Insights</span>
        </h1>

        <p className="mt-8 text-xl text-slate-300 max-w-3xl">
          Upload your sales, inventory, and customer data.
          Get forecasts, anomaly detection, and AI-generated
          recommendations to drive smarter business decisions.
        </p>

        <div className="mt-10 flex gap-4">
          <Link href="/register">
            <button className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700">
              Start Free
            </button>
          </Link>

          <Link href="/dashboard">
            <button className="px-6 py-3 border border-slate-700 rounded-lg">
              View Dashboard
            </button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">

          <div className="bg-slate-900 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-3">
              Forecasting
            </h3>
            <p className="text-slate-400">
              Predict future sales and inventory needs using
              machine learning models.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-3">
              AI Recommendations
            </h3>
            <p className="text-slate-400">
              Receive actionable business insights generated
              from your data.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-3">
              Executive Reports
            </h3>
            <p className="text-slate-400">
              Generate professional reports and summaries
              automatically.
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}