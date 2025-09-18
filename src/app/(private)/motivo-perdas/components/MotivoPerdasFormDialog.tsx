// FILE: src/app/(private)/motivo-perdas/components/MotivoPerdasFormDialog.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import { useCreateMotivoPerda, useUpdateMotivoPerda } from "../hooks/useMotivoPerdas";
import type { MotivoPerda } from "@/types";

const formSchema = z.object({
    name: z
        .string()
        .min(1, "Nome é obrigatório")
        .max(255, "Nome deve ter no máximo 255 caracteres"),
    situacao: z.boolean(),
    obs: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MotivoPerdasFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    motivoPerda?: MotivoPerda | null;
}

export default function MotivoPerdasFormDialog({
    open,
    onOpenChange,
    motivoPerda,
}: MotivoPerdasFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!motivoPerda;

    const createMutation = useCreateMotivoPerda();
    const updateMutation = useUpdateMotivoPerda();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            situacao: true,
            obs: "",
        },
    });

    // Preenche quando abrir para editar; limpa quando abrir para criar
    useEffect(() => {
        if (!open) return;
        if (motivoPerda) {
            form.reset({
                name: motivoPerda.name,
                situacao: motivoPerda.situacao,
                obs: motivoPerda.obs ?? "",
            });
        } else {
            form.reset({
                name: "",
                situacao: true,
                obs: "",
            });
        }
    }, [open, motivoPerda, form]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            if (isEditing) {
                if (motivoPerda?.id == null) {
                    throw new Error("ID motivo de perda ausente.")
                }
                await updateMutation.mutateAsync({
                    id: motivoPerda.id,
                    data,
                });
            } else {
                await createMutation.mutateAsync({
                    name: data.name,
                    situacao: data.situacao,
                    obs: data?.obs,
                });
            }
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao salvar forma de pagamento:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        form.reset();
        onOpenChange(false);
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
                    <DialogTitle className="text-xl font-bold">
                        {isEditing ? "Editar Motivo de Perda" : "Novo Motivo de Perda"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Edite as informações do motivo de perda abaixo."
                            : "Preencha as informações para criar um novo motivo de perda."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base font-medium">Nome *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Digite o nome do motivo de perda"
                                            {...field}
                                            autoFocus
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="situacao"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/30">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base font-medium">Status Ativo</FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            Define se o motivo de perda está ativo no sistema
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isSubmitting}
                                            className="cursor-pointer"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="obs"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base font-medium">Observações</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Digite observações adicionais (opcional)"
                                            className="min-h-[80px] resize-none"
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.reset();
                                    onOpenChange(false);
                                }}
                                disabled={isSubmitting}
                                className="cursor-pointer"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="cursor-pointer"
                            >
                                {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}