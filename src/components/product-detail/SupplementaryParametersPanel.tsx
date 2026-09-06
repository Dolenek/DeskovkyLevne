import type { Translator } from "../../types/i18n";
import type { SupplementaryParameter } from "../../types/product";
import { prioritizeParameters } from "../../utils/productFacts";

const ParameterRows = ({ parameters }: { parameters: SupplementaryParameter[] }) => (
  <dl className="grid gap-3 text-sm">
    {parameters.map((parameter, index) => (
      <div key={`${parameter.name}-${index}`} className="grid grid-cols-2 gap-4 break-words">
        <dt className="font-semibold text-muted">{parameter.name}</dt>
        <dd className="font-bold">{parameter.value}</dd>
      </div>
    ))}
  </dl>
);

export const SupplementaryParametersPanel = ({
  parameters,
  t,
}: {
  parameters: SupplementaryParameter[];
  t: Translator;
}) => {
  const ordered = prioritizeParameters(parameters);
  if (!ordered.length) return <p className="text-sm text-muted">{t("detailSupplementaryEmpty")}</p>;
  return (
    <div>
      <ParameterRows parameters={ordered.slice(0, 8)} />
      {ordered.length > 8 ? (
        <details className="mt-4">
          <summary className="cursor-pointer py-2 font-bold text-primary">{t("detailAllParameters")}</summary>
          <ParameterRows parameters={ordered.slice(8)} />
        </details>
      ) : null}
    </div>
  );
};
