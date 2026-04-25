import { BrandLogo } from "./BrandLogo";

const links = ["Jak to funguje", "Hry", "E-shopy", "O projektu", "Kontakt"];

export const AppFooter = () => (
  <footer className="border-t border-line bg-white">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-muted sm:px-6 lg:px-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <BrandLogo compact />
        <nav className="flex flex-wrap gap-8 font-semibold text-navy">
          {links.map((link) => (
            <a key={link} href="/deskove-hry" className="hover:text-primary">
              {link}
            </a>
          ))}
        </nav>
        <p>© 2026 DeskovkyLevně</p>
      </div>
    </div>
  </footer>
);
