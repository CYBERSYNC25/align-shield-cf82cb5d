import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Upload, Eye, CheckCircle, AlertCircle, FileX, Calendar } from 'lucide-react';
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

      // Merge with templates - create missing ones
      const existingNames = new Set(data?.map(d => d.name) || []);
      const documentsToCreate = DOCUMENT_TEMPLATES.filter(
        template => !existingNames.has(template.name)
      );

      // Create missing documents
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

        // Refetch after creating
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
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentId}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Update policy record
      const { error: updateError } = await supabase
        .from('policies')
        .update({ 
          file_url: publicUrl,
          status: 'active' // Mark as active when file is uploaded
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
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />Em Vigor</Badge>;
      case 'review':
        return <Badge className="bg-warning/10 text-warning border-warning/20"><AlertCircle className="h-3 w-3 mr-1" />Revisão Necessária</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted/10"><FileX className="h-3 w-3 mr-1" />Não Iniciado</Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Em Vigor';
      case 'review': return 'Revisão Necessária';
      default: return 'Não Iniciado';
    }
  };

  const implementationProgress = documents.length > 0 
    ? Math.round((documents.filter(d => d.status === 'active').length / documents.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Políticas e Documentos</h1>
            <p className="text-muted-foreground">
              Organize e gerencie seus documentos oficiais de segurança e compliance
            </p>
          </div>

          {/* Compliance Progress */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Resumo de Conformidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Documentação Implementada</span>
                  <span className="text-2xl font-bold text-primary">{implementationProgress}%</span>
                </div>
                <Progress value={implementationProgress} className="h-3" />
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                  <span>{documents.filter(d => d.status === 'active').length} de {documents.length} documentos em vigor</span>
                  {documents.filter(d => d.status === 'review').length > 0 && (
                    <span className="text-warning">{documents.filter(d => d.status === 'review').length} precisam de revisão</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Grid */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando documentos...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <FileText className="h-8 w-8 text-primary" />
                      {getStatusBadge(doc.status)}
                    </div>
                    <CardTitle className="text-lg">{doc.name}</CardTitle>
                    <CardDescription>{doc.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Version */}
                    <div className="space-y-2">
                      <Label htmlFor={`version-${doc.id}`} className="text-xs">Versão</Label>
                      <Input
                        id={`version-${doc.id}`}
                        value={doc.version}
                        onChange={(e) => handleVersionUpdate(doc.id, e.target.value)}
                        className="h-8"
                        placeholder="v1.0"
                      />
                    </div>

                    {/* Approval Date */}
                    <div className="space-y-2">
                      <Label htmlFor={`date-${doc.id}`} className="text-xs">Data de Aprovação</Label>
                      <Input
                        id={`date-${doc.id}`}
                        type="date"
                        value={doc.effective_date || ''}
                        onChange={(e) => handleDateUpdate(doc.id, e.target.value)}
                        className="h-8"
                      />
                    </div>

                    {/* File Upload/View */}
                    <div className="space-y-2">
                      {doc.file_url ? (
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => window.open(doc.file_url!, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar PDF
                          </Button>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Atualizado {format(new Date(doc.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      ) : (
                        <div>
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
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() => document.getElementById(`upload-${doc.id}`)?.click()}
                            disabled={uploadingId === doc.id}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingId === doc.id ? 'Enviando...' : 'Upload PDF'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Status Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleStatusChange(doc.id, 
                          doc.status === 'active' ? 'review' : 'active'
                        )}
                      >
                        {doc.status === 'active' ? 'Marcar Revisão' : 'Aprovar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PolicyDocuments;
