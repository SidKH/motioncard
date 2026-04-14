import { GithubLogo } from "@/components/github-logo";
import { Logo } from "@/components/logo";
import { MotioncardEditor } from "./motioncard-editor";

const GITHUB_REPO_URL = "https://github.com/SidKH/motioncard";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background font-sans">
      <header className="border-b border-border">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Logo className="size-4 shrink-0 text-foreground" />
            <span className="text-sm font-medium text-foreground">motioncard</span>
          </div>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground/60 transition-colors hover:text-foreground"
            aria-label="View source on GitHub"
          >
            <GithubLogo className="size-4" />
            <span>GitHub</span>
          </a>
        </div>
      </header>
      <MotioncardEditor />
    </div>
  );
}
