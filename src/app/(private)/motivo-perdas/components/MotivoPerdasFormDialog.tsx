// FILE: src/app/(private)/motivo-perdas/components/MotivoPerdasFormDialog.tsx
"use client";

import React, { useEffect } from "react";
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
import type { MotivoPerda } from "@/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";

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
    onSubmit: (data: FormData) => Promise<void>;
    isSubmitting: boolean;
}

export default function MotivoPerdasFormDialog({
    open,
    onOpenChange,
    motivoPerda,
    onSubmit,
    isSubmitting,
}: MotivoPerdasFormDialogProps) {
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

    const handleSubmit = async (data: FormData) => {
        await onSubmit(data);
        if (!motivoPerda) form.reset();
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
                        {motivoPerda ? "Editar Motivo de Perda" : "Novo Motivo de Perda"}
                    </DialogTitle>
                    <DialogDescription>
                        {motivoPerda
                            ? "Edite as informações do motivo de perda abaixo."
                            : "Preencha as informações para criar um novo motivo de perda."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                                            className="h-11"
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
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                                {isSubmitting ? (
                                    <LoadingSpinner size="sm" text="Salvando..." />
                                ) : motivoPerda ? (
                                    "Salvar Alterações"
                                ) : (
                                    "Criar Motivo"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}