import { BoardGameVisual } from "../../components/ui/BoardGameVisual";
import { Icon } from "../../components/ui/Icon";

interface SearchHeroProps {
  total: number;
  imageUrls?: string[];
}

export const SearchHero = ({ total, imageUrls = [] }: SearchHeroProps) => (
  <section className="grid items-center gap-8 lg:grid-cols-[1fr_0.75fr]">
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
          <p className="font-extrabold text-navy">27 e-shopů</p>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="refresh" className="h-7 w-7 text-primary" />
          <p className="font-extrabold text-navy">Denně aktualizované ceny</p>
        </div>
      </div>
    </div>
    <div className="hidden justify-end lg:flex">
      <BoardGameVisual imageUrls={imageUrls} />
    </div>
  </section>
);
