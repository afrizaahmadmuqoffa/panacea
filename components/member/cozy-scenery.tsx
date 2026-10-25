import { Cloud, Leaf, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function CozyScenery({
  density = "full",
  className,
}: {
  density?: "full" | "soft";
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -right-20 -top-24 size-72 rounded-full bg-[radial-gradient(circle,rgb(246_217_130/0.5),transparent_65%)]" />
      <div className="absolute -left-16 bottom-[-40%] size-72 rounded-full bg-[radial-gradient(circle,rgb(185_214_182/0.35),transparent_68%)]" />
      {density === "full" ? (
        <>
          <Cloud
            className="cozy-cloud absolute right-[34%] top-5 size-9 text-white/90 drop-shadow-[0_4px_0_rgb(185_214_182/0.25)]"
            strokeWidth={1.6}
          />
          <Cloud
            className="cozy-cloud absolute right-[8%] top-16 size-6 text-white/80"
            strokeWidth={1.6}
            style={{ animationDelay: "3s" }}
          />
        </>
      ) : null}
      <Sparkles
        className="cozy-bob absolute left-[52%] top-7 size-4 text-butter-300"
        style={{ animationDelay: "0.4s" }}
      />
      <Sparkles
        className="cozy-bob absolute left-[46%] top-24 size-3 text-sage-300"
        style={{ animationDelay: "1.8s" }}
      />
      <Sparkles
        className="cozy-bob absolute right-[30%] top-32 hidden size-3 text-sage-300 md:block"
        style={{ animationDelay: "2.6s" }}
      />
      <Leaf
        className="cozy-leaf absolute right-[38%] top-24 hidden size-5 text-sage-300 md:block"
        style={{ animationDelay: "0.9s" }}
      />
      <Leaf
        className="cozy-leaf absolute left-[4%] top-10 hidden size-4 text-[#a7bf7e] lg:block"
        style={{ animationDelay: "2.1s" }}
      />
    </div>
  );
}
