// FILE: src/app/(private)/motivo-pausas/components/MotivoDePausaFormDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useCreateSexo, useUpdateSexo } from "../hooks/useCadSexo";
import type { Sexo } from "@/types";

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    // ❗️Sem .default(true) para evitar boolean | undefined no tipo de entrada
    situacao: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface SexoFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cadSexo?: Sexo | null;
}

export default function SexoFormDialog({
    open,
    onOpenChange,
    cadSexo,
}: SexoFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!cadSexo;

    const createMutation = useCreateSexo();
    const updateMutation = useUpdateSexo();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            situacao: true, // ✅ default fica no RHF
        },
    });

    // Preenche quando abrir/editar; limpa quando abrir/criar
    useEffect(() => {
        if (!open) return;
        if (cadSexo) {
            form.reset({
                name: cadSexo.name,
                situacao: cadSexo.situacao,
            });
        } else {
            form.reset({ name: "", situacao: true });
        }
    }, [open, cadSexo, form]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            if (isEditing) {
                if (cadSexo?.id == null) {
                    throw new Error("ID motivo de pausa ausente.")
                }
                await updateMutation.mutateAsync({
                    id: cadSexo.id,
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
            console.error("Erro ao salvar motivo de pausa:", error);
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Motivo de Pausa" : "Novo Motivo de Pausa"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Digite o nome do motivo de pausa..."
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
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Status</FormLabel>
                                        <div className="text-[0.8rem] text-muted-foreground">
                                            Ativar ou desativar este motivo de pausa
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

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => {
                                    form.reset();
                                    onOpenChange(false);
                                }}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                                {isSubmitting ? "Salvando..." : "Salvar"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}