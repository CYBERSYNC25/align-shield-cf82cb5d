import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = 
  | "success" 
  | "warning" 
  | "danger" 
  | "info" 
  | "pending" 
  | "active" 
  | "inactive"
  | "draft"
  | "published";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  const getStatusConfig = (status: StatusType) => {
    const configs = {
      success: {
        className: "status-success",
        defaultLabel: "Sucesso"
      },
      warning: {
        className: "status-warning", 
        defaultLabel: "Atenção"
      },
      danger: {
        className: "status-danger",
        defaultLabel: "Erro"
      },
      info: {
        className: "status-info",
        defaultLabel: "Info"
      },
      pending: {
        className: "bg-warning/10 text-warning border border-warning/20",
        defaultLabel: "Pendente"
      },
      active: {
        className: "bg-success/10 text-success border border-success/20",
        defaultLabel: "Ativo"
      },
      inactive: {
        className: "bg-muted text-muted-foreground border border-border",
        defaultLabel: "Inativo"
      },
      draft: {
        className: "bg-muted text-muted-foreground border border-border",
        defaultLabel: "Rascunho"
      },
      published: {
        className: "bg-success/10 text-success border border-success/20",
        defaultLabel: "Publicado"
      }
    };

    return configs[status];
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      className={cn(
        config.className,
        "rounded-full px-3 py-1 text-xs font-medium",
        className
      )}
    >
      {label || config.defaultLabel}
    </Badge>
  );
};

export default StatusBadge;