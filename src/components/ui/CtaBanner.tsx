import { Icon } from "./Icon";
import { BOARD_GAME_SCENE_ASSETS } from "./boardGameSceneAssets";

interface CtaBannerProps {
  title: string;
  subtitle: string;
  actionLabel: string;
  href?: string;
}

export const CtaBanner = ({
  title,
  subtitle,
  actionLabel,
  href = "/deskove-hry",
}: CtaBannerProps) => (
  <section className="overflow-hidden rounded-lg bg-navy text-white shadow-[0_18px_45px_rgba(5,38,83,0.22)]">
    <div className="relative flex flex-col gap-6 px-6 py-7 md:flex-row md:items-center md:justify-between lg:px-10">
      <Icon name="star" className="absolute right-8 top-5 h-16 w-16 text-white/10" />
      <Icon name="dice" className="absolute bottom-3 right-64 hidden h-10 w-10 text-white/10 lg:block" />
      <div className="flex items-center gap-5">
        <div className="hidden min-w-[250px] md:block lg:min-w-[320px]">
          <img
            src={BOARD_GAME_SCENE_ASSETS.ctaComponents}
            alt=""
            className="h-24 w-[250px] object-contain object-left drop-shadow-2xl lg:h-28 lg:w-[320px]"
            loading="lazy"
          />
        </div>
        <div className="relative">
          <h2 className="max-w-xl text-2xl font-extrabold leading-tight md:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-sm text-blue-100">{subtitle}</p>
        </div>
      </div>
      <a
        href={href}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-7 py-4 text-sm font-extrabold text-white shadow-lg transition hover:bg-orange-600"
      >
        {actionLabel}
        <Icon name="arrowRight" className="h-4 w-4" />
      </a>
    </div>
  </section>
);
