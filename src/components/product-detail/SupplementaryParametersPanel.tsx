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
      <div className="rounded-2xl border border-dashed border-outline p-4 text-center text-sm text-muted">
        {t("detailSupplementaryEmpty")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline bg-surface-muted p-4">
      <h3 className="text-lg font-semibold text-ink">
        {t("detailSupplementaryTitle")}
      </h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {parameters.map((parameter, index) => (
          <div
            key={`${parameter.name}-${parameter.value}-${index}`}
            className="rounded-xl border border-outline bg-white/70 px-4 py-3"
          >
            <dt className="text-xs uppercase tracking-wide text-muted">
              {parameter.name}
            </dt>
            <dd className="text-base font-medium text-ink">
              {parameter.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
