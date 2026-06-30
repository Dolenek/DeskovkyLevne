import { useRef, type ReactElement } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "../utils/numberFormat";
import { PriceChartTooltip } from "./product-chart/PriceChartTooltip";
import type { PriceChartDatum, ProductChartProps } from "./product-chart/types";

export type { PriceChartRange } from "./product-chart/types";

interface EndpointDotProps {
  cx?: number;
  cy?: number;
  payload?: PriceChartDatum;
}

const renderEndpointDot = (
  props: EndpointDotProps,
  dataKey: string,
  color: string
): ReactElement<SVGElement> | null => {
  if (!props.payload?.[`${dataKey}IsLatest`] || props.cx === undefined || props.cy === undefined) {
    return null;
  }

  return <circle cx={props.cx} cy={props.cy} r={4.5} fill="#ffffff" stroke={color} strokeWidth={3} />;
};

export const ProductChart = ({
  series,
  locale,
  priceLabel,
  dateLabel,
  model,
}: ProductChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  if (model.data.length === 0 || model.activeSellerConfigs.length === 0) {
    return null;
  }

  return (
    <div className="min-w-0">
      <div className="custom-scrollbar overflow-x-auto lg:overflow-visible">
        <div ref={chartContainerRef} className="h-[320px] min-w-[760px] lg:min-w-0">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={model.data} margin={{ top: 14, right: 22, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#e7edf5" vertical={false} />
              <XAxis
                dataKey="date"
                minTickGap={22}
                stroke="#60708c"
                tick={{ fill: "#60708c", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                domain={model.yDomain}
                stroke="#60708c"
                tick={{ fill: "#60708c", fontSize: 12 }}
                tickLine={false}
                width={82}
                tickFormatter={(value) =>
                  formatPrice(Number(value), series.currency ?? undefined, locale) ?? ""
                }
              />
              <Tooltip
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ pointerEvents: "none", zIndex: 100 }}
                content={
                  <PriceChartTooltip
                    chartContainerRef={chartContainerRef}
                    locale={locale}
                    sellerLabels={model.sellerLabels}
                    currencyBySeller={model.currencyBySeller}
                    priceLabel={priceLabel}
                    dateLabel={dateLabel}
                  />
                }
              />
              {model.activeSellerConfigs.map((config) => {
                const legendItem = model.legendItems.find((item) => item.id === config.id);

                return (
                  <Line
                    key={config.id}
                    type="monotone"
                    dataKey={config.id}
                    stroke={config.color}
                    strokeWidth={legendItem?.isBest ? 3.5 : 2.5}
                    dot={(props) => renderEndpointDot(props, config.id, config.color)}
                    activeDot={{ r: 5 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
