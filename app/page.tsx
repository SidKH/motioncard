import { RemotionPoc } from "./remotion-poc";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background px-6 py-16 font-sans">
      <main className="flex w-full max-w-3xl flex-col gap-10">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Remotion client-side rendering POC
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Preview with the Remotion Player, then encode the same composition in
            the browser via{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
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
