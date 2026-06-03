"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { NhanVatRow } from "@/lib/repositories/speaking.repo";
import { CheckIcon, MicIcon } from "lucide-react";
import { SpeakingSessionClient } from "./speaking-session-client";

type Props = {
  nhanVats: NhanVatRow[];
};

export function CharacterSelectionClient({ nhanVats }: Props) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const selectedCharacter = useMemo(
    () => nhanVats.find((character) => character.id === selectedCharacterId) ?? null,
    [nhanVats, selectedCharacterId],
  );

  if (nhanVats.length === 0) {
    return <EmptyCharacters />;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {nhanVats.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            selected={character.id === selectedCharacterId}
            onSelect={() => setSelectedCharacterId(character.id)}
          />
        ))}
      </div>

      {selectedCharacter ? (
        <section className="rounded-2xl border border-lm-primary/30 bg-lm-bg-elev-1 p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-lm-fg">
                Luyện nói với {selectedCharacter.ten}
              </h3>
              <p className="text-sm text-lm-fg-muted">
                Chọn chủ đề phù hợp với vai của nhân vật rồi bắt đầu phiên luyện nói.
              </p>
            </div>
            <Badge className="self-start bg-lm-primary-soft text-lm-primary-ink hover:bg-lm-primary-soft">
              Đang chọn
            </Badge>
          </div>
          <SpeakingSessionClient
            key={selectedCharacter.id}
            nhanVatId={selectedCharacter.id}
            nhanVatTen={selectedCharacter.ten}
            nhanVatAvatar={selectedCharacter.url_avatar ?? null}
            nhanVatSlug={selectedCharacter.slug}
            nhanVatGiong={selectedCharacter.giong}
          />
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-lm-border bg-lm-bg-elev-1 p-6 text-center">
          <p className="text-sm font-medium text-lm-fg">Chọn một nhân vật để bắt đầu</p>
          <p className="mt-1 text-xs text-lm-fg-muted">
            Sau khi chọn, bạn sẽ chọn tình huống luyện nói ở bước tiếp theo.
          </p>
        </div>
      )}
    </div>
  );
}

function CharacterCard({
  character,
  selected,
  onSelect,
}: {
  character: NhanVatRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "group rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lm-primary focus-visible:ring-offset-2",
        selected && "ring-2 ring-lm-primary/30",
      )}
    >
      <Card
        className={cn(
          "h-full border-lm-border bg-lm-bg-elev-1 transition-all group-hover:-translate-y-0.5 group-hover:border-lm-primary/60 group-hover:shadow-sm",
          selected && "border-lm-primary bg-lm-primary-soft",
        )}
      >
        <CardContent className="flex items-center gap-4 py-4">
          <Avatar
            className={cn(
              "h-14 w-14 ring-2 transition-all",
              selected ? "ring-lm-primary" : "ring-lm-border group-hover:ring-lm-primary",
            )}
          >
            <AvatarImage src={character.url_avatar ?? ""} alt={character.ten} />
            <AvatarFallback className="text-lg font-bold">
              {character.ten.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-lm-fg">
                  {character.ten}
                </div>
                {character.giong ? (
                  <div className="text-xs text-lm-fg-muted">{character.giong}</div>
                ) : null}
              </div>
              {selected ? (
                <span className="rounded-full bg-lm-primary text-lm-fg-on-primary p-1">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {character.cefr_toi_thieu ? (
                <Badge variant="outline" className="text-xs">
                  Từ {character.cefr_toi_thieu}
                </Badge>
              ) : null}
              {character.nhan?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function EmptyCharacters() {
  return (
    <div className="rounded-lg border border-dashed border-lm-border bg-lm-bg-elev-1 p-12 text-center">
      <MicIcon className="mx-auto h-10 w-10 text-lm-fg-muted/50" />
      <p className="mt-4 text-sm text-lm-fg-muted">
        Chưa có nhân vật nào. Nhân vật sẽ được thêm khi seed database.
      </p>
      <p className="mt-1 text-xs text-lm-fg-muted">
        Nhân vật mẫu: Sophie (British), Marcus (American), Linh (Vietnamese ESL).
      </p>
    </div>
  );
}
