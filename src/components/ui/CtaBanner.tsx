import { Icon } from "./Icon";

interface CtaBannerProps {
  title: string;
  subtitle: string;
  actionLabel: string;
  href?: string;
  imageUrls?: string[];
}

export const CtaBanner = ({
  title,
  subtitle,
  actionLabel,
  href = "/deskove-hry",
  imageUrls = [],
}: CtaBannerProps) => (
  <section className="overflow-hidden rounded-lg bg-navy text-white shadow-[0_18px_45px_rgba(5,38,83,0.22)]">
    <div className="relative flex flex-col gap-6 px-6 py-7 md:flex-row md:items-center md:justify-between lg:px-10">
      <Icon name="star" className="absolute right-8 top-5 h-16 w-16 text-white/10" />
      <Icon name="dice" className="absolute bottom-3 right-64 hidden h-10 w-10 text-white/10 lg:block" />
      <div className="flex items-center gap-5">
        <div className="hidden min-w-[220px] items-center gap-3 md:flex">
          {imageUrls.length === 0 ? (
            <>
              <span className="flex h-16 w-16 rotate-12 items-center justify-center rounded-lg bg-orange-500 text-white shadow-xl">
                <Icon name="dice" className="h-9 w-9" />
              </span>
              <span className="flex h-16 w-16 -rotate-6 items-center justify-center rounded-lg bg-white text-navy shadow-xl">
                <Icon name="box" className="h-9 w-9" />
              </span>
              <span className="flex h-16 w-16 rotate-6 items-center justify-center rounded-lg bg-primary text-white shadow-xl">
                <Icon name="spark" className="h-9 w-9" />
              </span>
            </>
          ) : null}
          {imageUrls.slice(0, 3).map((url, index) => (
            <img
              key={`${url}-${index}`}
              src={url}
              alt=""
              className={`h-20 w-20 rounded-lg bg-white object-cover shadow-xl ${
                index === 0 ? "-rotate-12" : index === 1 ? "rotate-6" : "-rotate-3"
              }`}
            />
          ))}
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
