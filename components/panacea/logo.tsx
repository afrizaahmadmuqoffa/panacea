import { LogoMark } from "./logo-mark";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-12 shrink-0 place-items-center rounded-[15px] bg-sage-100 text-sage-600 shadow-[inset_0_-3px_0_rgb(84_122_96_/_0.09)] -rotate-5">
        <LogoMark className="size-8 object-contain" />
      </span>
      <span className="font-heading text-[25px] font-black leading-none tracking-[-1px] text-bark-900">
        panacea<span className="text-sage-700">.</span>
      </span>
    </span>
  );
}
