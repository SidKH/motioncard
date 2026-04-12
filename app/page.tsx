import { RemotionPoc } from "./remotion-poc";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background font-sans">
      <header className="border-b border-border">
        <div className="flex h-14 w-full items-center px-6">
          <span className="text-base font-normal text-foreground">Project X</span>
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center px-6 py-16">
        <main className="flex w-full max-w-3xl flex-col gap-10">
          <RemotionPoc />
        </main>
      </div>
    </div>
  );
}
