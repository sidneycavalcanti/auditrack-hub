// FILE: src/app/(private)/cad-questoes/components/CadQuestoesFormDialog.tsx
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import type { CadQuestoes } from "@/types";
import { useCreateCadQuestoes, useUpdateCadQuestoes } from "../hooks/useCadQuestoes";
import { useCadAvOperacional } from "../../cad-av-operacional/hooks/useCadAvOperacional";

/** 🔧 Importante: sem .default() para evitar boolean | undefined no input type */
const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  situacao: z.boolean(),
  cadavoperacionalId: z.number().optional(),
});
type FormData = z.infer<typeof formSchema>;

interface CadQuestoesFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questao?: CadQuestoes | null;
}

export default function CadQuestoesFormDialog({
  open,
  onOpenChange,
  questao,
}: CadQuestoesFormDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      situacao: true,            // ✅ default fica aqui
      cadavoperacionalId: undefined,
    },
  });

  const createMutation = useCreateCadQuestoes();
  const updateMutation = useUpdateCadQuestoes();
  const { data: avaliacoesOperacionais } = useCadAvOperacional();

  const isEditing = !!questao;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    if (questao) {
      form.reset({
        name: questao.name,
        situacao: questao.situacao,
        cadavoperacionalId: questao.cadavoperacionalId,
      });
    } else {
      form.reset({
        name: "",
        situacao: true,
        cadavoperacionalId: undefined,
      });
    }
  }, [open, questao, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && questao) {
        await updateMutation.mutateAsync({ id: questao.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      form.reset();
      onOpenChange(false);
    } catch {
      // erros tratados nos hooks
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Questão" : "Nova Questão"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Questão</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o nome da questão"
                      {...field}
                      autoFocus
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cadavoperacionalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avaliação Operacional</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? undefined : Number(value))
                    }
                    value={field.value?.toString() || "none"}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Selecione uma avaliação operacional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none" className="text-muted">Nenhum</SelectItem>
                      {avaliacoesOperacionais?.data?.map((av: any) => (
                        <SelectItem key={av.id} value={av.id.toString()}>
                          {av.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="situacao"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Questão ativa no sistema
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="cursor-pointer"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                className="cursor-pointer"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button className="cursor-pointer" type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}