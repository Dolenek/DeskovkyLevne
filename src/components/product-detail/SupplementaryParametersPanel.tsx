import type { Translator } from "../../types/i18n";
import type { SupplementaryParameter } from "../../types/product";

interface SupplementaryParametersPanelProps {
  parameters: SupplementaryParameter[];
  t: Translator;
}

export const SupplementaryParametersPanel = ({
  parameters,
  t,
}: SupplementaryParametersPanelProps) => {
  if (parameters.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-400">
        {t("detailSupplementaryEmpty")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
      <h3 className="text-lg font-semibold text-white">
        {t("detailSupplementaryTitle")}
      </h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {parameters.map((parameter, index) => (
          <div
            key={`${parameter.name}-${parameter.value}-${index}`}
            className="rounded-xl bg-slate-950/30 px-4 py-3"
          >
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              {parameter.name}
            </dt>
            <dd className="text-base font-medium text-slate-100">
              {parameter.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
