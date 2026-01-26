import { useState } from 'react';
import { useApiKeys, ApiKey } from '@/hooks/useApiKeys';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Key, Plus, Copy, Trash2, Ban, ExternalLink, Check, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function ApiKeysManagement() {
  const {
    apiKeys,
    isLoading,
    newlyCreatedKey,
    clearNewlyCreatedKey,
    createApiKey,
    isCreating,
    revokeApiKey,
    isRevoking,
    deleteApiKey,
    isDeleting,
  } = useApiKeys();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [tier, setTier] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [hasWriteScope, setHasWriteScope] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<string>('');

  const handleCreate = () => {
    createApiKey({
      name,
      scopes: hasWriteScope ? ['read', 'write'] : ['read'],
      rate_limit_tier: tier,
      expires_in_days: expiresInDays ? parseInt(expiresInDays) : undefined,
    });
  };

  const handleCopyKey = async () => {
    if (newlyCreatedKey) {
      await navigator.clipboard.writeText(newlyCreatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseNewKeyDialog = () => {
    clearNewlyCreatedKey();
    setIsCreateDialogOpen(false);
    setName('');
    setTier('free');
    setHasWriteScope(false);
    setExpiresInDays('');
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return <Badge className="bg-purple-500">Enterprise</Badge>;
      case 'pro':
        return <Badge className="bg-blue-500">Pro</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const getRateLimitText = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'Ilimitado';
      case 'pro':
        return '1.000/min';
      default:
        return '100/min';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Gerencie chaves de API para integrar com sistemas externos
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/developers">
                <ExternalLink className="w-4 h-4 mr-2" />
                Documentação
              </Link>
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                {newlyCreatedKey ? (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        API Key Criada!
                      </DialogTitle>
                      <DialogDescription>
                        Copie sua chave agora. Por segurança, ela não será exibida novamente.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all">
                        {newlyCreatedKey}
                      </div>
                      <Button onClick={handleCopyKey} className="w-full">
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar API Key
                          </>
                        )}
                      </Button>
                      <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-amber-600">
                          Guarde esta chave em local seguro. Você não poderá vê-la novamente.
                        </span>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={handleCloseNewKeyDialog}>
                        Fechar
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>Criar Nova API Key</DialogTitle>
                      <DialogDescription>
                        Configure as permissões e limites da nova chave
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome da Chave</Label>
                        <Input
                          id="name"
                          placeholder="Ex: Integração CI/CD"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tier de Rate Limit</Label>
                        <Select value={tier} onValueChange={(v) => setTier(v as typeof tier)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free (100 req/min)</SelectItem>
                            <SelectItem value="pro">Pro (1.000 req/min)</SelectItem>
                            <SelectItem value="enterprise">Enterprise (Ilimitado)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Permissão de Escrita</Label>
                          <p className="text-sm text-muted-foreground">
                            Permite disparar sincronizações
                          </p>
                        </div>
                        <Switch checked={hasWriteScope} onCheckedChange={setHasWriteScope} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expires">Expira em (dias)</Label>
                        <Input
                          id="expires"
                          type="number"
                          placeholder="Deixe vazio para não expirar"
                          value={expiresInDays}
                          onChange={(e) => setExpiresInDays(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreate} disabled={!name || isCreating}>
                        {isCreating ? 'Criando...' : 'Criar API Key'}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma API Key criada ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie uma chave para começar a usar a API
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Uso Hoje</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id} className={key.is_revoked ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{key.key_prefix}</code>
                  </TableCell>
                  <TableCell>{getTierBadge(key.rate_limit_tier)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">read</Badge>
                      {key.scopes.includes('write') && (
                        <Badge variant="outline" className="text-xs">write</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {key.requests_today} / {getRateLimitText(key.rate_limit_tier)}
                  </TableCell>
                  <TableCell>
                    {key.is_revoked ? (
                      <Badge variant="destructive">Revogada</Badge>
                    ) : key.expires_at && new Date(key.expires_at) < new Date() ? (
                      <Badge variant="secondary">Expirada</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-500">Ativa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(key.created_at), { addSuffix: true, locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!key.is_revoked && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setKeyToRevoke(key.id)}
                          title="Revogar"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setKeyToDelete(key.id)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!keyToRevoke} onOpenChange={() => setKeyToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              A chave será desativada imediatamente. Qualquer aplicação usando esta chave perderá acesso à API.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (keyToRevoke) revokeApiKey(keyToRevoke);
                setKeyToRevoke(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!keyToDelete} onOpenChange={() => setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. A chave será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (keyToDelete) deleteApiKey(keyToDelete);
                setKeyToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
