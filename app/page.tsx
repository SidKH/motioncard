import { MotionCardLogo } from "@/components/motion-card-logo";
import { MotioncardEditor } from "./motioncard-editor";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background font-sans">
      <header className="border-b border-border">
        <div className="flex h-14 w-full items-center gap-2 px-6">
          <MotionCardLogo className="size-4 shrink-0 text-foreground" />
          <span className="text-sm font-medium text-foreground">Motioncard</span>
        </div>
      </header>
      <MotioncardEditor />
    </div>
  );
}
