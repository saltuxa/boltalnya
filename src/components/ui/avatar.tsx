import Image from "next/image";
import { cn, initials } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  className?: string;
};

export function Avatar({ src, name, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-md border border-neutral-800 bg-neutral-900 text-xs font-semibold text-neutral-300",
        className
      )}
    >
      {src ? (
        <Image src={src} alt={name ?? "Аватар"} fill sizes="48px" className="object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}
