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
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? "Аватар"} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}
