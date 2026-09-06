export const BrandLogo = ({ compact = false }: { compact?: boolean }) => (
  <span className="inline-flex items-center gap-2 font-extrabold text-navy">
    <img src="/logo.png" alt="" className={compact ? "h-7 w-7 sm:h-8 sm:w-8" : "h-11 w-11"} />
    <span className={compact ? "text-base leading-none sm:text-xl" : "text-3xl leading-none"}>
      <span className="text-primary">Deskovky</span>Levně
    </span>
  </span>
);
