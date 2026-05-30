"use client";

import { useEffect, useState } from "react";
import { toggleDanhDauAction, xoaTuAction } from "../../actions";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StarIcon, SearchIcon, Trash2Icon } from "lucide-react";
import type { TuDaLuuRow, ViDuItem } from "@/lib/repositories/vocab.repo";

const TRANG_THAI_LABEL: Record<string, string> = {
  moi: "Mới",
  dang_hoc: "Đang học",
  on_tap: "Ôn tập",
  thuoc: "Đã thuộc",
};

export function VocabListClient({
  words,
  deckId,
}: {
  words: TuDaLuuRow[];
  deckId: string;
}) {
  const [list, setList] = useState(words);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`vocab-words:${deckId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tu_da_luu",
          filter: `bo_tu_id=eq.${deckId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedWord = payload.old as Pick<TuDaLuuRow, "id">;
            setList((prev) => prev.filter((word) => word.id !== deletedWord.id));
            return;
          }

          const changedWord = payload.new as TuDaLuuRow;
          setList((prev) => {
            const existingWord = prev.some((word) => word.id === changedWord.id);
            const nextList = existingWord
              ? prev.map((word) => (word.id === changedWord.id ? changedWord : word))
              : [changedWord, ...prev];

            return nextList.sort((firstWord, secondWord) =>
              secondWord.tao_luc.localeCompare(firstWord.tao_luc),
            );
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [deckId]);

  const filtered = search
    ? list.filter((w) => w.tu_goc.toLowerCase().includes(search.toLowerCase()))
    : list;

  async function onToggleStar(tuId: string) {
    const result = await toggleDanhDauAction(tuId);
    if (result.ok) {
      setList((prev) =>
        prev.map((w) =>
          w.id === tuId ? { ...w, da_danh_dau: result.data!.daDanhDau } : w,
        ),
      );
    }
  }

  async function onDelete(tuId: string) {
    if (!confirm("Xoá từ này?")) return;
    const result = await xoaTuAction(tuId);
    if (result.ok) {
      setList((prev) => prev.filter((w) => w.id !== tuId));
    }
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm từ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((word) => (
          <Card key={word.id} className="group">
            <CardContent className="flex items-start gap-3 py-3 px-4">
              {/* Star */}
              <button
                onClick={() => onToggleStar(word.id)}
                className="mt-0.5 shrink-0 transition-colors"
                aria-label={word.da_danh_dau ? "Bỏ đánh dấu" : "Đánh dấu sao"}
              >
                <StarIcon
                  className={`h-4 w-4 ${
                    word.da_danh_dau
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground opacity-0 group-hover:opacity-100"
                  }`}
                />
              </button>

              {/* Word info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-base">{word.tu_goc}</span>
                  {word.phien_am && (
                    <span className="text-sm text-muted-foreground lm-mono">
                      {word.phien_am}
                    </span>
                  )}
                  {word.loai_tu && (
                    <Badge variant="outline" className="text-xs">
                      {word.loai_tu}
                    </Badge>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {word.nghia_en ? (
                    <span className="text-muted-foreground">{word.nghia_en}</span>
                  ) : null}
                  {word.nghia_vi ? (
                    <span className="text-muted-foreground">{word.nghia_vi}</span>
                  ) : null}
                </div>

                {/* Examples */}
                {word.vi_du && word.vi_du.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {word.vi_du.slice(0, 2).map((ex: ViDuItem, i: number) => (
                      <p key={i} className="lm-example text-sm">
                        {ex.en}
                        {ex.vi && <span className="ml-1 text-xs text-muted-foreground not-italic">— {ex.vi}</span>}
                      </p>
                    ))}
                  </div>
                )}

                {/* Meta */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      word.trang_thai === "thuoc"
                        ? "bg-lm-success-soft text-lm-success-ink"
                        : word.trang_thai === "dang_hoc"
                        ? "bg-lm-warning-soft text-lm-warning-ink"
                        : ""
                    }`}
                  >
                    {TRANG_THAI_LABEL[word.trang_thai] ?? word.trang_thai}
                  </Badge>
                  {word.cefr_phu_hop && (
                    <Badge
                      className="text-xs text-white"
                      style={{
                        backgroundColor: `var(--lm-cefr-${word.cefr_phu_hop.toLowerCase()})`,
                      }}
                    >
                      {word.cefr_phu_hop}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => onDelete(word.id)}
                className="mt-1 shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                aria-label="Xoá từ"
              >
                <Trash2Icon className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && search && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Không tìm thấy từ nào matching &quot;{search}&quot;
        </p>
      )}
    </div>
  );
}
