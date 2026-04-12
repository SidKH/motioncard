import { RemotionPoc } from "./remotion-poc";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-background px-6 py-16 font-sans">
      <main className="flex w-full max-w-3xl flex-col gap-10">
        <RemotionPoc />
      </main>
    </div>
  );
}
