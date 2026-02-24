interface MacroPillProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

export function MacroPill({ label, current, target, color }: MacroPillProps) {
  const percent = Math.min(100, (current / target) * 100);

  return (
    <div className="flex-1">
      <div className="text-[10px] text-dark-text-secondary mb-1 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-[13px] font-bold text-dark-text-primary mb-1.5">
        {current}
        <span className="text-[10px] text-dark-text-secondary font-normal">
          /{target}g
        </span>
      </div>
      <div className="h-[3px] rounded-full bg-[#1e2030]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            backgroundColor: color,
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}
