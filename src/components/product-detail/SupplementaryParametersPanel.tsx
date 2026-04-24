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
      <div className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-muted">
        {t("detailSupplementaryEmpty")}
      </div>
    );
  }

  return (
    <dl className="grid gap-3 text-sm">
      {parameters.slice(0, 8).map((parameter, index) => (
        <div key={`${parameter.name}-${index}`} className="grid grid-cols-[1fr_1.2fr] gap-4">
          <dt className="font-bold text-muted">{parameter.name}</dt>
          <dd className="font-extrabold text-navy">{parameter.value}</dd>
        </div>
      ))}
    </dl>
  );
};
