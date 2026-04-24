import { Icon } from "../../components/ui/Icon";

interface SearchHeroProps {
  total: number;
}

export const SearchHero = ({ total }: SearchHeroProps) => (
  <section className="grid items-center gap-8 lg:grid-cols-[1fr_0.8fr]">
    <div>
      <p className="text-sm font-bold text-muted">Domů / Hry / Katalog</p>
      <h1 className="mt-6 text-4xl font-black leading-tight text-navy sm:text-5xl">
        Katalog deskových her
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        Procházejte tisíce deskových her, porovnávejte jejich ceny a zjistěte,
        kde je koupíte nejlevněji.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <Icon name="spark" className="h-7 w-7 text-primary" />
          <p className="font-extrabold text-navy">{total.toLocaleString("cs-CZ")} her</p>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="cart" className="h-7 w-7 text-primary" />
          <p className="font-extrabold text-navy">e-shopy v katalogu</p>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="refresh" className="h-7 w-7 text-primary" />
          <p className="font-extrabold text-navy">Denně aktualizované ceny</p>
        </div>
      </div>
    </div>
    <div className="hidden justify-end lg:flex">
      <div className="relative h-56 w-full max-w-md rounded-lg bg-white shadow-sm">
        <div className="absolute left-10 top-12 h-20 w-20 rotate-12 rounded-lg bg-primary shadow-xl" />
        <div className="absolute left-28 top-20 h-16 w-16 -rotate-12 rounded-lg bg-accent shadow-xl" />
        <div className="absolute right-16 top-8 h-24 w-24 rotate-6 rounded-lg bg-slate-100 shadow-xl" />
        <div className="absolute bottom-8 right-28 h-16 w-16 rounded-lg bg-white shadow-xl" />
      </div>
    </div>
  </section>
);
