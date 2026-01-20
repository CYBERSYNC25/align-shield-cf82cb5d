import { CheckCircle2, Clock, Circle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ControlsCategoryAccordionProps {
  controlsSummary: {
    total: number;
    passing: number;
    in_progress: number;
    not_started: number;
  };
  primaryColor?: string;
}

export const ControlsCategoryAccordion = ({
  controlsSummary,
  primaryColor,
}: ControlsCategoryAccordionProps) => {
  const { total, passing, in_progress, not_started } = controlsSummary;
  const overallProgress = total > 0 ? (passing / total) * 100 : 0;

  const categories = [
    {
      id: "implemented",
      label: "Implementados",
      count: passing,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      description: "Controles totalmente implementados e verificados",
    },
    {
      id: "in-progress",
      label: "Em Progresso",
      count: in_progress,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      description: "Controles em fase de implementação",
    },
    {
      id: "pending",
      label: "Pendentes",
      count: not_started,
      icon: Circle,
      color: "text-gray-500 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-800/50",
      description: "Controles ainda não iniciados",
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ 
                backgroundColor: primaryColor ? `${primaryColor}20` : 'hsl(var(--primary) / 0.1)',
              }}
            >
              <BarChart3 
                className="h-5 w-5" 
                style={{ color: primaryColor || 'hsl(var(--primary))' }}
              />
            </div>
            <CardTitle className="text-lg">Controles Implementados</CardTitle>
          </div>
          <span className="text-2xl font-bold text-foreground">
            {passing}/{total}
          </span>
        </div>
        <div className="mt-4">
          <Progress value={overallProgress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round(overallProgress)}% dos controles estão implementados
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Accordion type="multiple" className="w-full">
          {categories.map((category) => (
            <AccordionItem key={category.id} value={category.id} className="border-border/50">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${category.bgColor}`}>
                    <category.icon className={`h-4 w-4 ${category.color}`} />
                  </div>
                  <span className="font-medium text-foreground">{category.label}</span>
                  <span className={`text-sm font-semibold ${category.color}`}>
                    ({category.count})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <p className="text-sm text-muted-foreground pl-10">
                  {category.description}
                </p>
                {category.count > 0 && (
                  <div className="mt-2 pl-10">
                    <div className="text-xs text-muted-foreground">
                      {category.count === 1 
                        ? `${category.count} controle nesta categoria`
                        : `${category.count} controles nesta categoria`
                      }
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
