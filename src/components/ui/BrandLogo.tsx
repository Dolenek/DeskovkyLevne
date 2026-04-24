export const BrandLogo = ({ compact = false }: { compact?: boolean }) => (
  <span className="inline-flex items-center gap-2 font-extrabold text-navy">
    <img
      src="/logo.png"
      alt=""
      className={compact ? "h-8 w-8" : "h-10 w-10"}
    />
    <span className={compact ? "text-xl" : "text-2xl"}>
      <span className="text-primary">Deskovky</span>Levně
    </span>
  </span>
);
