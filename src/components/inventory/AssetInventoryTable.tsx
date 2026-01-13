import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  User,
  GitBranch,
  Laptop,
  Globe,
  Database,
  MessageSquare,
  Folder,
  HelpCircle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  MoreHorizontal,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Asset, AssetType, AssetComplianceStatus } from '@/hooks/useAssetInventory';

interface AssetInventoryTableProps {
  assets: Asset[];
  isLoading?: boolean;
}

const TYPE_ICONS: Record<AssetType, React.ComponentType<{ className?: string }>> = {
  user: User,
  repository: GitBranch,
  device: Laptop,
  domain: Globe,
  bucket: Database,
  channel: MessageSquare,
  project: Folder,
  other: HelpCircle,
};

const TYPE_COLORS: Record<AssetType, string> = {
  user: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  repository: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  device: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  domain: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  bucket: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  channel: 'bg-green-500/10 text-green-600 border-green-500/20',
  project: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  other: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const COMPLIANCE_STATUS_CONFIG: Record<
  AssetComplianceStatus,
  { icon: React.ComponentType<{ className?: string }>; label: string; className: string }
> = {
  pass: {
    icon: CheckCircle2,
    label: 'Aprovado',
    className: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  fail: {
    icon: XCircle,
    label: 'Reprovado',
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  'not-checked': {
    icon: MinusCircle,
    label: 'Não Verificado',
    className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  },
};

function AssetTypeBadge({ type, label }: { type: AssetType; label: string }) {
  const Icon = TYPE_ICONS[type];
  return (
    <Badge variant="outline" className={cn('gap-1', TYPE_COLORS[type])}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function ComplianceStatusBadge({
  status,
  issues,
}: {
  status: AssetComplianceStatus;
  issues: string[];
}) {
  const config = COMPLIANCE_STATUS_CONFIG[status];
  const Icon = config.icon;

  const badge = (
    <Badge variant="outline" className={cn('gap-1', config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );

  if (issues.length === 0) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium mb-1">Problemas encontrados:</p>
        <ul className="list-disc list-inside text-sm">
          {issues.map((issue, idx) => (
            <li key={idx}>{issue}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

function IntegrationBadge({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex items-center gap-2">
      {logo ? (
        <img src={logo} alt={name} className="h-5 w-5 object-contain" />
      ) : (
        <div className="h-5 w-5 rounded bg-muted flex items-center justify-center">
          <Database className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
      <span className="text-sm">{name}</span>
    </div>
  );
}

export function AssetInventoryTable({ assets, isLoading }: AssetInventoryTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sincronizado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-5 w-28 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (assets.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ativo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Status de Compliance</TableHead>
            <TableHead>Última Sincronização</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">
                <span className="truncate max-w-[200px] block">{asset.name}</span>
              </TableCell>
              <TableCell>
                <AssetTypeBadge type={asset.type} label={asset.typeLabel} />
              </TableCell>
              <TableCell>
                <IntegrationBadge name={asset.integrationName} logo={asset.integrationLogo} />
              </TableCell>
              <TableCell>
                <ComplianceStatusBadge
                  status={asset.complianceStatus}
                  issues={asset.complianceIssues}
                />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistanceToNow(asset.lastSynced, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir na Origem
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
