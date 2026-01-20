import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

interface ComplianceGaugeChartProps {
  score: number;
  primaryColor?: string;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return "hsl(142, 76%, 36%)"; // green
  if (score >= 60) return "hsl(48, 96%, 53%)"; // yellow
  return "hsl(0, 84%, 60%)"; // red
};

const getScoreLabel = (score: number): string => {
  if (score >= 90) return "Excelente";
  if (score >= 80) return "Muito Bom";
  if (score >= 70) return "Bom";
  if (score >= 60) return "Regular";
  return "Precisa Atenção";
};

export const ComplianceGaugeChart = ({ score, primaryColor }: ComplianceGaugeChartProps) => {
  const displayScore = Math.round(score);
  const fillColor = primaryColor || getScoreColor(score);
  
  const data = [
    {
      name: "Score",
      value: displayScore,
      fill: fillColor,
    },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="w-[200px] h-[200px] md:w-[280px] md:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={20}
            data={data}
            startAngle={225}
            endAngle={-45}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "hsl(var(--muted))" }}
              dataKey="value"
              cornerRadius={10}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Score display in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-4xl md:text-5xl font-bold"
          style={{ color: fillColor }}
        >
          {displayScore}%
        </span>
        <span className="text-sm md:text-base text-muted-foreground mt-1">
          {getScoreLabel(score)}
        </span>
      </div>
      
      {/* Label below */}
      <p className="text-center text-muted-foreground mt-4 text-sm md:text-base">
        Compliance Score
      </p>
    </div>
  );
};
