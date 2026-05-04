import { BrandLogo } from "./BrandLogo";

const links = [{ href: "/deskove-hry", label: "Katalog" }];

export const AppFooter = () => (
  <footer className="border-t border-line bg-white">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-muted sm:px-6 lg:px-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <BrandLogo compact />
        <nav className="flex flex-wrap gap-8 font-semibold text-navy">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-primary">
              {link.label}
            </a>
          ))}
        </nav>
        <p>© 2026 DeskovkyLevně</p>
      </div>
    </div>
  </footer>
);
