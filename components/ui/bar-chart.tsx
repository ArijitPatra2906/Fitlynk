interface BarChartProps {
  data: number[];
  color?: string;
  labels?: string[];
}

export function BarChart({ data, color = "#3B82F6", labels }: BarChartProps) {
  const max = Math.max(...data);

  return (
    <div className="w-full">
      <div className="flex items-end gap-1 h-[50px]">
        {data.map((value, index) => {
          const height = max > 0 ? (value / max) * 100 : 0;
          const isLast = index === data.length - 1;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
            >
              <div
                className="w-full rounded-sm transition-all duration-500 min-h-[3px]"
                style={{
                  backgroundColor: isLast ? color : color + "55",
                  height: `${height}%`,
                }}
              />
            </div>
          );
        })}
      </div>
      {labels && (
        <div className="flex justify-between mt-2">
          {labels.map((label, index) => (
            <div
              key={index}
              className="flex-1 text-center text-[10px] text-gray-600 dark:text-gray-500"
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
