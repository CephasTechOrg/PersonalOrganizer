import { monogram, orgColor } from "@/ui/lib/format";

interface MonogramProps {
  name: string | null | undefined;
  size?: number;
}

export function Monogram({ name, size = 30 }: MonogramProps) {
  const { bg, fg } = orgColor(name);
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        borderRadius: Math.round(size * 0.26),
        display: "grid",
        placeItems: "center",
        fontSize: Math.max(10, Math.round(size * 0.36)),
        fontWeight: 800,
        background: bg,
        color: fg,
      }}
      aria-hidden="true"
    >
      {monogram(name)}
    </span>
  );
}
