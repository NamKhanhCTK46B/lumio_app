"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { taoBoTuAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon, Loader2 } from "lucide-react";

const formSchema = z.object({
  ten: z.string().min(1, "Tên bộ từ không được để trống").max(64),
  mo_ta: z.string().max(256).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const MAU_BIA_OPTIONS = [
  "#E8A33D", "#2F9E83", "#3F7BD8", "#BD5B85",
  "#7B3DA0", "#D85A5A", "#D98A2B", "#5B8DD9",
];

export function TaoBoTuDialog() {
  const [open, setOpen] = useState(false);
  const [mauBia, setMauBia] = useState(MAU_BIA_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ten: "", mo_ta: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const result = await taoBoTuAction({ ...values, mau_bia: mauBia });
    setSubmitting(false);

    if (result.ok) {
      setOpen(false);
      form.reset();
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="gap-1.5" />
        }
      >
          <PlusIcon className="h-3.5 w-3.5" />
          Tạo bộ từ
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo bộ từ mới</DialogTitle>
          <DialogDescription>
            Tạo bộ từ riêng để lưu từ vựng theo chủ đề bạn quan tâm.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ten"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên bộ từ</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: IELTS Band 7 Vocabulary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mo_ta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả (tuỳ chọn)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả ngắn về bộ từ này..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color picker */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Màu bìa</span>
              <div className="flex gap-2 flex-wrap">
                {MAU_BIA_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setMauBia(color)}
                    className="h-8 w-8 rounded-lg border-2 transition-all"
                    style={{ backgroundColor: color }}
                    aria-label={`Chọn màu ${color}`}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo bộ từ"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
