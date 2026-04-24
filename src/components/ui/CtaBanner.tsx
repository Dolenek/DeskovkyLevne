import { Icon } from "./Icon";

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
      <div className="absolute left-4 top-2 hidden text-white/10 md:block">
        <Icon name="spark" className="h-20 w-20" />
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden gap-2 md:flex">
          <span className="h-14 w-14 rotate-12 rounded-lg bg-orange-200 shadow-lg" />
          <span className="h-12 w-12 rounded-lg bg-white shadow-lg" />
          <span className="h-11 w-11 -rotate-12 rounded-lg bg-primary shadow-lg" />
        </div>
        <div className="relative">
          <h2 className="text-2xl font-extrabold leading-tight md:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-sm text-blue-100">{subtitle}</p>
        </div>
      </div>
      <a
        href={href}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:bg-orange-600"
      >
        {actionLabel}
        <Icon name="arrowRight" className="h-4 w-4" />
      </a>
    </div>
  </section>
);
