// FILE: src/app/(private)/formas-pagamento/components/FormaPagamentoFormDialog.tsx
"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { useCreateFormaPagamento, useUpdateFormaPagamento } from "../hooks/useFormasPagamento";
import type { FormaPagamento } from "@/types";

const formaPagamentoSchema = z.object({
    name: z.string().trim().min(1, "Nome é obrigatório"),
    situacao: z.boolean(),
});

type FormaPagamentoFormData = z.infer<typeof formaPagamentoSchema>;

interface FormaPagamentoFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formaPagamento?: FormaPagamento | null;
}

export function FormaPagamentoFormDialog({
    open,
    onOpenChange,
    formaPagamento,
}: FormaPagamentoFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!formaPagamento;

    const createMutation = useCreateFormaPagamento();
    const updateMutation = useUpdateFormaPagamento();

    const form = useForm<FormaPagamentoFormData>({
        resolver: zodResolver(formaPagamentoSchema),
        defaultValues: {
            name: "",
            situacao: true,
        },
    });

    // Preenche o form quando abrir/editar; limpa quando fechar
    useEffect(() => {
        if (open) {
        if (formaPagamento) {
            form.reset({
            name: formaPagamento.name,
            situacao: !!formaPagamento.situacao,
            });
        } else {
            form.reset({ name: "", situacao: true });
        }
        }
    }, [open, formaPagamento, form]);

    const onSubmit = async (data: FormaPagamentoFormData) => {
        setIsSubmitting(true);
        try {
        if (isEditing) {
            if (formaPagamento?.id == null) {
            throw new Error("ID da forma de pagamento ausente.");
            }
            await updateMutation.mutateAsync({
            id: formaPagamento.id,
            data,
            });
        } else {
            await createMutation.mutateAsync({
            name: data.name,
            situacao: data.situacao,
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                        ? "Edite as informações da forma de pagamento."
                        : "Preencha as informações para criar uma nova forma de pagamento."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl>
                                    <Input
                                    placeholder="Digite o nome da forma de pagamento"
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
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Situação</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                    Defina se a forma de pagamento está ativa ou inativa
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

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}