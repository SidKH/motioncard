import { RemotionPoc } from "./remotion-poc";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background font-sans">
      <header className="border-b border-border">
        <div className="flex h-14 w-full items-center px-6">
          <span className="text-sm font-medium text-foreground">Motion Card</span>
        </div>
      </header>
      <RemotionPoc />
    </div>
  );
}
