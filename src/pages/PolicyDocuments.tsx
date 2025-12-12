import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Upload, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  FileX, 
  Calendar,
  FolderOpen,
  Clock,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PolicyDocument {
  id: string;
  name: string;
  category: string;
  description: string;
  status: string;
  version: string;
  effective_date: string | null;
  file_url: string | null;
  updated_at: string;
}

const DOCUMENT_TEMPLATES = [
  {
    name: 'Política de Segurança da Informação',
    category: 'Segurança',
    description: 'Diretrizes gerais de segurança da informação'
  },
  {
    name: 'Código de Ética',
    category: 'Ética',
    description: 'Princípios e valores organizacionais'
  },
  {
    name: 'Plano de Continuidade de Negócios',
    category: 'Continuidade',
    description: 'Procedimentos para manutenção das operações'
  },
  {
    name: 'Política de Privacidade (LGPD)',
    category: 'Privacidade',
    description: 'Tratamento de dados pessoais conforme LGPD'
  },
  {
    name: 'Política de Controle de Acesso',
    category: 'Segurança',
    description: 'Gestão de acessos e privilégios'
  },
  {
    name: 'Política de Backup e Recuperação',
    category: 'Continuidade',
    description: 'Procedimentos de backup e disaster recovery'
  },
  {
    name: 'Política de Gestão de Incidentes',
    category: 'Segurança',
    description: 'Resposta e tratamento de incidentes de segurança'
  },
  {
    name: 'Política de Desenvolvimento Seguro',
    category: 'Desenvolvimento',
    description: 'Práticas de desenvolvimento seguro de software'
  }
];

const PolicyDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('user_id', user.id)
        .in('category', ['Segurança', 'Ética', 'Continuidade', 'Privacidade', 'Desenvolvimento'])
        .order('name');

      if (error) throw error;

      const existingNames = new Set(data?.map(d => d.name) || []);
      const documentsToCreate = DOCUMENT_TEMPLATES.filter(
        template => !existingNames.has(template.name)
      );

      if (documentsToCreate.length > 0) {
        const newDocs = documentsToCreate.map(template => ({
          name: template.name,
          category: template.category,
          description: template.description,
          status: 'draft',
          version: '1.0',
          user_id: user.id
        }));

        const { error: insertError } = await supabase
          .from('policies')
          .insert(newDocs);

        if (insertError) throw insertError;

        const { data: refreshedData } = await supabase
          .from('policies')
          .select('*')
          .eq('user_id', user.id)
          .in('category', ['Segurança', 'Ética', 'Continuidade', 'Privacidade', 'Desenvolvimento'])
          .order('name');

        setDocuments(refreshedData || []);
      } else {
        setDocuments(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os documentos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentId: string, file: File) => {
    if (!user) return;

    setUploadingId(documentId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentId}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('policies')
        .update({ 
          file_url: publicUrl,
          status: 'active'
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      toast({
        title: 'Sucesso',
        description: 'Documento enviado com sucesso',
      });

      fetchDocuments();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload do documento',
        variant: 'destructive'
      });
    } finally {
      setUploadingId(null);
    }
  };

  const handleVersionUpdate = async (documentId: string, version: string) => {
    try {
      const { error } = await supabase
        .from('policies')
        .update({ version })
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId ? { ...doc, version } : doc
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar versão:', error);
    }
  };

  const handleDateUpdate = async (documentId: string, effective_date: string) => {
    try {
      const { error } = await supabase
        .from('policies')
        .update({ effective_date })
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId ? { ...doc, effective_date } : doc
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar data:', error);
    }
  };

  const handleStatusChange = async (documentId: string, newStatus: 'active' | 'review' | 'draft') => {
    try {
      const { error } = await supabase
        .from('policies')
        .update({ status: newStatus })
        .eq('id', documentId);

      if (error) throw error;

      fetchDocuments();

      toast({
        title: 'Status atualizado',
        description: `Documento marcado como ${getStatusLabel(newStatus)}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Em Vigor
          </Badge>
        );
      case 'review':
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Revisão
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <FileX className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Em Vigor';
      case 'review': return 'Revisão Necessária';
      default: return 'Não Iniciado';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Segurança':
        return <Shield className="h-5 w-5 text-primary" />;
      case 'Continuidade':
        return <Clock className="h-5 w-5 text-amber-400" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const implementationProgress = documents.length > 0 
    ? Math.round((documents.filter(d => d.status === 'active').length / documents.length) * 100)
    : 0;

  const activeCount = documents.filter(d => d.status === 'active').length;
  const reviewCount = documents.filter(d => d.status === 'review').length;
  const pendingCount = documents.filter(d => d.status === 'draft').length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <FolderOpen className="h-6 w-6 text-primary" />
                  Políticas e Documentos
                </h1>
                <p className="text-muted-foreground mt-1">
                  Organize e gerencie seus documentos oficiais de segurança e compliance
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{documents.length}</p>
                      <p className="text-sm text-muted-foreground">Total de Documentos</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                      <p className="text-sm text-muted-foreground">Em Vigor</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-amber-500/10">
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{reviewCount}</p>
                      <p className="text-sm text-muted-foreground">Em Revisão</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <FileX className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                      <p className="text-sm text-muted-foreground">Pendentes</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Card */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Progresso de Conformidade Documental
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Documentação Implementada</span>
                      <span className="text-2xl font-bold text-primary">{implementationProgress}%</span>
                    </div>
                    <Progress value={implementationProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {activeCount} de {documents.length} documentos em vigor
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="h-full">
                      <CardHeader>
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-5 w-3/4 mt-3" />
                        <Skeleton className="h-4 w-full mt-2" />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-9 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="h-full flex flex-col bg-card border-border hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="p-2 rounded-lg bg-muted">
                            {getCategoryIcon(doc.category)}
                          </div>
                          {getStatusBadge(doc.status)}
                        </div>
                        <CardTitle className="text-base leading-tight">{doc.name}</CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {doc.description}
                        </CardDescription>
                        <Badge variant="outline" className="w-fit text-[10px] mt-1">
                          {doc.category}
                        </Badge>
                      </CardHeader>
                      
                      <CardContent className="space-y-3 flex-1 flex flex-col">
                        {/* Version & Date Row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor={`version-${doc.id}`} className="text-[10px] text-muted-foreground">
                              Versão
                            </Label>
                            <Input
                              id={`version-${doc.id}`}
                              value={doc.version}
                              onChange={(e) => handleVersionUpdate(doc.id, e.target.value)}
                              className="h-7 text-xs"
                              placeholder="v1.0"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`date-${doc.id}`} className="text-[10px] text-muted-foreground">
                              Aprovação
                            </Label>
                            <Input
                              id={`date-${doc.id}`}
                              type="date"
                              value={doc.effective_date || ''}
                              onChange={(e) => handleDateUpdate(doc.id, e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>

                        {/* File Upload/View */}
                        <div className="flex-1 flex flex-col justify-end space-y-2 pt-2 border-t border-border/50">
                          {doc.file_url ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => window.open(doc.file_url!, '_blank')}
                              >
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                Visualizar PDF
                              </Button>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-center">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(doc.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept=".pdf"
                                id={`upload-${doc.id}`}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(doc.id, file);
                                }}
                              />
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => document.getElementById(`upload-${doc.id}`)?.click()}
                                disabled={uploadingId === doc.id}
                              >
                                <Upload className="h-3.5 w-3.5 mr-2" />
                                {uploadingId === doc.id ? 'Enviando...' : 'Upload PDF'}
                              </Button>
                            </>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleStatusChange(doc.id, 
                              doc.status === 'active' ? 'review' : 'active'
                            )}
                          >
                            {doc.status === 'active' ? 'Marcar para Revisão' : 'Aprovar Documento'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </PageContainer>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PolicyDocuments;
