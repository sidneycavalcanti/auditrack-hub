// FILE: src/app/(private)/cad-av-operacional/components/CadAvOperacionalFormDialog.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  useCreateCadAvOperacional,
  useUpdateCadAvOperacional,
} from "../hooks/useCadAvOperacional";
import type { CadAvOperacional } from "@/types";

interface CadAvOperacionalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CadAvOperacional | null;
}

type FormState = {
  descricao: string;
  situacao: boolean;
};

export default function CadAvOperacionalFormDialog({
  open,
  onOpenChange,
  initialData,
}: CadAvOperacionalFormDialogProps) {
  const isEdit = !!initialData?.id;

  const [form, setForm] = useState<FormState>({
    descricao: "",
    situacao: true,
  });

  const { mutate: createCadAvOperacional, isPending: creating } =
    useCreateCadAvOperacional();
  const { mutate: updateCadAvOperacional, isPending: updating } =
    useUpdateCadAvOperacional();

  // Preenche/limpa ao abrir
  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        descricao: initialData.descricao ?? "",
        situacao: initialData.situacao ?? true,
      });
    } else {
      setForm({ descricao: "", situacao: true });
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    if (!form.descricao.trim()) return;

    const payload = {
      descricao: form.descricao.trim(),
      situacao: form.situacao,
    };

    if (isEdit && initialData) {
      updateCadAvOperacional(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    } else {
      createCadAvOperacional(payload, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isFormValid = form.descricao.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setForm({ descricao: "", situacao: true });
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Avaliação Operacional" : "Nova Avaliação Operacional"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={form.descricao}
              onChange={(e) =>
                setForm((s) => ({ ...s, descricao: e.target.value }))
              }
              placeholder="Digite a descrição da avaliação operacional"
              autoFocus
              disabled={creating || updating}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="situacao">Situação ativa</Label>
            <Switch
              id="situacao"
              checked={form.situacao}
              onCheckedChange={(checked) =>
                setForm((s) => ({ ...s, situacao: checked }))
              }
              disabled={creating || updating}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating || updating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={creating || updating || !isFormValid}
          >
            {isEdit ? "Salvar alterações" : "Criar registro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}