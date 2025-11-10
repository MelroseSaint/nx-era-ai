import * as React from "react";
import { cn } from "@/lib/utils";

const THEMES = {
  light: "light",
  dark: "dark",
  custom: "custom",
} as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
} & React.ComponentProps<"div">;

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a ChartContainer");
  }
  return context;
}

export interface ChartContainerProps extends React.ComponentProps<"div"> {
  config: ChartConfig;
}

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, className, children, ...props }, ref) => {
    const theme = THEMES.light;

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          className={cn("flex min-h-[240px] w-full flex-col gap-4", className)}
          {...props}
        >
          <ChartStyle config={config} theme={theme} />
          {children}
        </div>
      </ChartContext.Provider>
    );
  }
);
ChartContainer.displayName = "ChartContainer";

export interface ChartStyleProps extends React.ComponentProps<"style"> {
  config: ChartConfig;
  theme?: keyof typeof THEMES;
}

export function ChartStyle({ config, theme = THEMES.light, ...props }: ChartStyleProps) {
  const cssVariables = Object.entries(config).map(([key, value]) => {
    const color = value.theme ? value.theme[theme] : value.color;
    return color ? `--color-${key}: ${color};` : null;
  });

  return (
    <style
      {...props}
      dangerouslySetInnerHTML={{
        __html: `
          :root {
            ${cssVariables.filter(Boolean).join("\n")}
          }
        `,
      }}
    />
  );
}

export const ChartTooltip = React.Fragment;

export interface ChartTooltipContentProps extends React.ComponentProps<"div"> {
  indicator?: "dot" | "line" | "dashed" | "none";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  nameKey?: string;
}

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    { className, indicator = "dot", hideLabel, hideIndicator, nameKey, ...props },
    ref
  ) => {
    const { config } = useChart();
    const color = (key?: string) => (key ? `var(--color-${key})` : undefined);

    return (
      <div
        ref={ref}
        className={cn(
          "flex min-w-[160px] flex-col gap-2 rounded-md border bg-background/95 p-2 text-sm shadow-sm backdrop-blur",
          className
        )}
        {...props}
      >
        {props.children}
        {!hideLabel && (
          <div className="flex w-full items-center justify-between gap-4">
            {nameKey ? (
              <div className="flex items-center gap-2">
                {!hideIndicator && indicator !== "none" && (
                  <Indicator type={indicator} color={color(nameKey)} />
                )}
                <span className="font-medium">
                  {getPayloadConfigLabel(config, nameKey)}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

export const ChartLegend = React.Fragment;

export interface ChartLegendContentProps extends React.ComponentProps<"div"> {
  nameKey?: string;
}

export const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ className, nameKey, ...props }, ref) => {
    const { config } = useChart();

    return (
      <div
        ref={ref}
        className={cn("flex w-full items-center justify-between gap-4 text-sm", className)}
        {...props}
      >
        {nameKey ? (
          <div className="flex items-center gap-2">
            <Indicator type="dot" color={`var(--color-${nameKey})`} />
            <span>{getPayloadConfigLabel(config, nameKey)}</span>
          </div>
        ) : null}
      </div>
    );
  }
);
ChartLegendContent.displayName = "ChartLegendContent";

function Indicator({ type, color }: { type: "dot" | "line" | "dashed"; color?: string }) {
  if (type === "dot") {
    return <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />;
  }
  if (type === "line") {
    return <span className="h-[2px] w-3" style={{ backgroundColor: color }} />;
  }
  return (
    <span
      className="h-[2px] w-3"
      style={{ backgroundImage: `linear-gradient(to right, ${color} 50%, transparent 50%)` }}
    />
  );
}

function getPayloadConfigLabel(config: ChartConfig, key?: string) {
  if (!key) return "";
  const item = config[key];
  return item?.label ?? key;
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};

