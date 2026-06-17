import { BrandLogo } from "./BrandLogo";

export const AppFooter = () => (
  <footer className="border-t border-line bg-white">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-muted sm:px-6 lg:px-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <BrandLogo compact />
        <p>© 2026 DeskovkyLevně</p>
      </div>
    </div>
  </footer>
);
