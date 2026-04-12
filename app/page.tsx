import { RemotionPoc } from "./remotion-poc";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-3xl flex-col gap-10">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Remotion client-side rendering POC
          </h1>
          <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
            Preview with the Remotion Player, then encode the same composition in
            the browser via{" "}
            <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
              renderMediaOnWeb
            </code>
            .
          </p>
        </header>
        <RemotionPoc />
      </main>
    </div>
  );
}
