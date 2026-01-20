import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface RequestAccessModalProps {
  companySlug: string;
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
}

export const RequestAccessModal = ({
  companySlug,
  isOpen,
  onClose,
  primaryColor,
}: RequestAccessModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Por favor, informe seu nome");
      return;
    }
    if (!formData.email.trim() || !validateEmail(formData.email)) {
      toast.error("Por favor, informe um email válido");
      return;
    }
    if (!formData.company.trim()) {
      toast.error("Por favor, informe sua empresa");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call - in production, this would send to an Edge Function
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Solicitação enviada com sucesso!", {
        description: "Entraremos em contato em breve.",
      });

      // Reset form and close modal
      setFormData({ name: "", email: "", company: "", message: "" });
      onClose();
    } catch (error) {
      toast.error("Erro ao enviar solicitação", {
        description: "Por favor, tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Solicitar Acesso</DialogTitle>
          <DialogDescription>
            Preencha o formulário abaixo para solicitar acesso às informações
            detalhadas de compliance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Seu nome"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email corporativo *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@empresa.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Empresa *</Label>
            <Input
              id="company"
              name="company"
              placeholder="Nome da sua empresa"
              value={formData.company}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem (opcional)</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Descreva brevemente o motivo da solicitação..."
              rows={3}
              value={formData.message}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: primaryColor || undefined,
                borderColor: primaryColor || undefined,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Solicitação
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
