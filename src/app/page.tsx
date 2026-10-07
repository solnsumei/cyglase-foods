export default function Home() {
  return (
    <main className="min-h-screen bg-base-200/50 flex flex-col">
      {/* Top Navbar */}
      <header className="navbar bg-base-100 shadow-sm border-b border-base-200 px-4 lg:px-8">
        <div className="flex-1 items-center gap-1">
          <span className="text-2xl font-black tracking-tight text-primary">
            CYGLASE
          </span>
          <span className="text-2xl font-black tracking-tight text-secondary ml-1">
            FOODS
          </span>
          <span className="badge badge-secondary badge-sm ml-3 font-semibold text-[11px] shadow-sm">
            We do Delivery Too
          </span>
        </div>
        <div className="flex-none gap-2">
          <span className="badge badge-outline text-xs">Next.js 16 + daisyUI 5</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
        {/* Welcome Hero / Status */}
        <section className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h1 className="card-title text-2xl md:text-3xl font-bold">
              Project Scaffold Complete 🚀
            </h1>
            <p className="text-base-content/70 mt-1">
              Your Next.js project is configured with TypeScript, Tailwind CSS v4, daisyUI 5, and Supabase integration.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-base-200/60 border border-base-300/40">
                <div className="text-xs uppercase tracking-wider text-base-content/60 font-semibold">
                  Framework
                </div>
                <div className="text-lg font-bold mt-1">Next.js 16</div>
                <div className="text-xs text-success font-medium mt-0.5">App Router + Turbopack</div>
              </div>

              <div className="p-4 rounded-xl bg-base-200/60 border border-base-300/40">
                <div className="text-xs uppercase tracking-wider text-base-content/60 font-semibold">
                  Language
                </div>
                <div className="text-lg font-bold mt-1">TypeScript 5</div>
                <div className="text-xs text-success font-medium mt-0.5">Strict mode enabled</div>
              </div>

              <div className="p-4 rounded-xl bg-base-200/60 border border-base-300/40">
                <div className="text-xs uppercase tracking-wider text-base-content/60 font-semibold">
                  Styling & UI
                </div>
                <div className="text-lg font-bold mt-1">daisyUI 5</div>
                <div className="text-xs text-success font-medium mt-0.5">Tailwind CSS v4 engine</div>
              </div>

              <div className="p-4 rounded-xl bg-base-200/60 border border-base-300/40">
                <div className="text-xs uppercase tracking-wider text-base-content/60 font-semibold">
                  Backend
                </div>
                <div className="text-lg font-bold mt-1">Supabase</div>
                <div className="text-xs text-success font-medium mt-0.5">@supabase/ssr utilities</div>
              </div>
            </div>
          </div>
        </section>

        {/* Supabase Integration Details */}
        <section className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-xl font-bold">
              Supabase Configuration
            </h2>
            <p className="text-sm text-base-content/70">
              The project structure includes pre-configured client, server, and middleware modules for Supabase:
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="table table-zebra w-full text-sm">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono text-xs">src/lib/supabase/client.ts</td>
                    <td><span className="badge badge-sm badge-info">Client</span></td>
                    <td>Browser client for client components via <code>createBrowserClient</code></td>
                  </tr>
                  <tr>
                    <td className="font-mono text-xs">src/lib/supabase/server.ts</td>
                    <td><span className="badge badge-sm badge-primary">Server</span></td>
                    <td>Server client for Server Components, Server Actions & Route Handlers</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-xs">src/lib/supabase/middleware.ts</td>
                    <td><span className="badge badge-sm badge-secondary">Middleware</span></td>
                    <td>Session token refresher invoked by Next.js middleware</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-xs">src/middleware.ts</td>
                    <td><span className="badge badge-sm badge-ghost">Routing</span></td>
                    <td>Global request interceptor keeping Supabase auth cookies in sync</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-xs">src/types/database.types.ts</td>
                    <td><span className="badge badge-sm badge-accent">Types</span></td>
                    <td>Database TypeScript schema definitions interface</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="alert alert-info mt-6 text-sm">
              <span>
                To connect to your live project, add your Supabase project URL and anon key into <code className="font-mono font-bold">.env.local</code>.
              </span>
            </div>
          </div>
        </section>

        {/* daisyUI Component Verification */}
        <section className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-xl font-bold">
              daisyUI 5 Component Verification
            </h2>
            <p className="text-sm text-base-content/70">
              Sample daisyUI components verifying styling and utility classes:
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <button className="btn btn-primary btn-sm">Primary</button>
              <button className="btn btn-secondary btn-sm">Secondary</button>
              <button className="btn btn-accent btn-sm">Accent</button>
              <button className="btn btn-neutral btn-sm">Neutral</button>
              <button className="btn btn-outline btn-sm">Outline</button>
              <button className="btn btn-ghost btn-sm">Ghost</button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <span className="badge badge-primary">Primary</span>
              <span className="badge badge-secondary">Secondary</span>
              <span className="badge badge-success">Success</span>
              <span className="badge badge-warning">Warning</span>
              <span className="badge badge-error">Error</span>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-4 bg-base-100 text-base-content/60 border-t border-base-200 text-xs">
        <div>
          <p>© 2026 Cyglase Foods - Scaffolded with Next.js, daisyUI & Supabase</p>
        </div>
      </footer>
    </main>
  );
}
