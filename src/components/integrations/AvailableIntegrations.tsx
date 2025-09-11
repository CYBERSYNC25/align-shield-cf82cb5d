import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Star,
  Zap,
  Clock,
  Users,
  Building
} from 'lucide-react';

const AvailableIntegrations = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const integrationCategories = [
    {
      id: 'cloud',
      name: 'Cloud & Infraestrutura',
      icon: '☁️',
      integrations: [
        {
          name: 'Azure',
          description: 'Microsoft Azure - Governança, segurança e compliance',
          logo: '🔷',
          popular: true,
          controls: ['Criptografia', 'IAM', 'Network Security', 'Key Vault'],
          evidences: 180,
          setupTime: '15 min'
        },
        {
          name: 'Google Cloud',
          description: 'GCP - Configurações de segurança e IAM',
          logo: '🟡',
          popular: true,
          controls: ['Cloud IAM', 'VPC', 'Cloud KMS', 'Security Center'],
          evidences: 165,
          setupTime: '10 min'
        },
        {
          name: 'Terraform',
          description: 'Infrastructure as Code - Compliance de configurações',
          logo: '🏗️',
          controls: ['IaC Security', 'State Management', 'Policy as Code'],
          evidences: 89,
          setupTime: '5 min'
        }
      ]
    },
    {
      id: 'identity',
      name: 'Identidade & Acesso',
      icon: '🔐',
      integrations: [
        {
          name: 'Azure AD / Entra ID',
          description: 'Microsoft Entra ID - Gestão de identidades',
          logo: '🔵',
          popular: true,
          controls: ['SSO', 'MFA', 'Conditional Access', 'PIM'],
          evidences: 145,
          setupTime: '8 min'
        },
        {
          name: 'Google Workspace',
          description: 'Google Workspace - Admin e segurança',
          logo: '🟢',
          controls: ['SSO', '2FA', 'Admin Console', 'Vault'],
          evidences: 98,
          setupTime: '12 min'
        },
        {
          name: 'Auth0',
          description: 'Plataforma de identidade como serviço',
          logo: '🔴',
          controls: ['Identity Management', 'SSO', 'MFA'],
          evidences: 67,
          setupTime: '10 min'
        }
      ]
    },
    {
      id: 'devops',
      name: 'DevOps & CI/CD',
      icon: '🚀',
      integrations: [
        {
          name: 'GitLab',
          description: 'GitLab - Segurança em DevOps e SAST/DAST',
          logo: '🦊',
          popular: true,
          controls: ['Branch Protection', 'Security Scanning', 'Compliance'],
          evidences: 156,
          setupTime: '6 min'
        },
        {
          name: 'Bitbucket',
          description: 'Atlassian Bitbucket - Controle de código',
          logo: '🔵',
          controls: ['Repository Security', 'Branch Policies', 'User Access'],
          evidences: 78,
          setupTime: '8 min'
        },
        {
          name: 'Azure DevOps',
          description: 'Azure DevOps - Pipelines e segurança',
          logo: '🔷',
          controls: ['Pipeline Security', 'Artifact Management', 'Access Control'],
          evidences: 123,
          setupTime: '10 min'
        }
      ]
    },
    {
      id: 'security',
      name: 'Segurança & Vulnerabilidades',
      icon: '🛡️',
      integrations: [
        {
          name: 'Qualys',
          description: 'Qualys VMDR - Gestão de vulnerabilidades',
          logo: '🔍',
          controls: ['Vulnerability Scanning', 'Asset Discovery', 'Compliance'],
          evidences: 234,
          setupTime: '15 min'
        },
        {
          name: 'Tenable',
          description: 'Tenable.io - Vulnerability Management',
          logo: '🎯',
          controls: ['Vuln Assessment', 'Asset Management', 'Risk Scoring'],
          evidences: 198,
          setupTime: '12 min'
        },
        {
          name: 'Snyk',
          description: 'Snyk - Segurança em código e dependências',
          logo: '🐍',
          popular: true,
          controls: ['Code Security', 'Dependency Scanning', 'Container Security'],
          evidences: 145,
          setupTime: '5 min'
        }
      ]
    },
    {
      id: 'endpoints',
      name: 'Endpoints & MDM',
      icon: '💻',
      integrations: [
        {
          name: 'Microsoft Intune',
          description: 'Microsoft Intune - Gestão de dispositivos',
          logo: '🔷',
          popular: true,
          controls: ['Device Compliance', 'App Management', 'Security Policies'],
          evidences: 167,
          setupTime: '10 min'
        },
        {
          name: 'Kandji',
          description: 'Kandji - Apple Device Management',
          logo: '🍎',
          controls: ['macOS Security', 'iOS Management', 'Compliance'],
          evidences: 89,
          setupTime: '8 min'
        },
        {
          name: 'CrowdStrike',
          description: 'CrowdStrike Falcon - Endpoint Detection',
          logo: '🦅',
          controls: ['EDR', 'Threat Detection', 'Incident Response'],
          evidences: 234,
          setupTime: '15 min'
        }
      ]
    },
    {
      id: 'communication',
      name: 'Comunicação & Colaboração',
      icon: '💬',
      integrations: [
        {
          name: 'Slack',
          description: 'Slack - Políticas e governança',
          logo: '💼',
          popular: true,
          controls: ['Data Retention', 'Access Controls', 'Compliance Export'],
          evidences: 67,
          setupTime: '3 min'
        },
        {
          name: 'Microsoft Teams',
          description: 'Microsoft Teams - Governança e compliance',
          logo: '🟣',
          controls: ['Meeting Policies', 'Data Loss Prevention', 'Retention'],
          evidences: 89,
          setupTime: '5 min'
        },
        {
          name: 'Zoom',
          description: 'Zoom - Configurações de segurança',
          logo: '📹',
          controls: ['Meeting Security', 'User Management', 'Recording Policies'],
          evidences: 45,
          setupTime: '7 min'
        }
      ]
    }
  ];

  const filteredCategories = integrationCategories.map(category => ({
    ...category,
    integrations: category.integrations.filter(integration =>
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.integrations.length > 0);

  const allIntegrations = integrationCategories.flatMap(category => 
    category.integrations.map(integration => ({ ...integration, category: category.name }))
  );

  const popularIntegrations = allIntegrations.filter(integration => integration.popular);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Integrações Disponíveis
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar integrações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="popular" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="popular" className="gap-2">
            <Star className="h-4 w-4" />
            Populares
          </TabsTrigger>
          <TabsTrigger value="cloud">Cloud</TabsTrigger>
          <TabsTrigger value="identity">Identidade</TabsTrigger>
          <TabsTrigger value="devops">DevOps</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="communication">Comunicação</TabsTrigger>
        </TabsList>

        <TabsContent value="popular" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {popularIntegrations.map((integration, index) => (
              <IntegrationCard key={index} integration={integration} />
            ))}
          </div>
        </TabsContent>

        {filteredCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {category.integrations.map((integration, index) => (
                <IntegrationCard key={index} integration={integration} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const IntegrationCard = ({ integration }: { integration: any }) => {
  return (
    <Card className="bg-surface-elevated border-card-border hover:border-primary/20 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{integration.logo}</div>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                {integration.name}
                {integration.popular && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" />
                    Popular
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {integration.description}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Zap className="h-3 w-3" />
            {integration.evidences} evidências
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {integration.setupTime}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">CONTROLES SUPORTADOS</p>
          <div className="flex flex-wrap gap-1">
            {integration.controls.slice(0, 3).map((control, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {control}
              </Badge>
            ))}
            {integration.controls.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{integration.controls.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <Button className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Conectar
        </Button>
      </CardContent>
    </Card>
  );
};

export default AvailableIntegrations;