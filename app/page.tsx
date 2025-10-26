const featureHighlights = [
  {
    title: "Standard tooling, streamlined",
    description:
      "Manage accounts, deploy contracts, and inspect state changes with sensible defaults for popular networks.",
  },
  {
    title: "Experimental sandboxes",
    description:
      "Spin up isolated forks, prototype opcodes, and validate hypotheses without leaving the workspace.",
  },
  {
    title: "Composable modules",
    description:
      "Mix and match panels for transactions, storage, events, and analytics to suit your workflow.",
  },
  {
    title: "Template-driven testing",
    description:
      "Share reusable suites that stitch together scripts, fixtures, and assertions for fast iteration.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-16 px-6 py-16 sm:px-12">
        <section className="space-y-6">
          <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200">
            Modular EVM playground
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
            Build, experiment, and extend your Ethereum workflows in one interface.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            EVM Playground Interface brings standard and experimental tooling together through a modular surface. Compose
            interfaces, orchestrate calls, and stress-test smart contract ideas with full-stack templates that bridge UI,
            scripts, and network automation.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
              href="/workspace"
            >
              Open the playground
            </a>
            <a
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500"
              href="/docs"
            >
              View documentation
            </a>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          {featureHighlights.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {feature.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-8 text-center backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Ready to prototype your next EVM idea?
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Start from a template, import an existing project, or stitch together new modules to create a bespoke
            end-to-end environment for your team.
          </p>
        </section>
      </main>
    </div>
  );
}
