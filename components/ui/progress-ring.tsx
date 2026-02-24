interface ProgressRingProps {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  percent,
  size = 80,
  stroke = 7,
  color = "#3B82F6",
  bgColor = "#1e2030",
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = ((100 - percent) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-600 ease-out"
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-sm font-bold text-dark-text-primary leading-none">
            {label}
          </div>
          {sublabel && (
            <div className="text-[9px] text-dark-text-secondary mt-0.5">
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
