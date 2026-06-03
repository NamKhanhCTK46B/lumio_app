import type { ExtractedSegment } from "./types";

const MAX_SOURCE_CHARS = 24_000;
const MIN_PARAGRAPH_CHARS = 60;
const MAX_PARAGRAPH_CHARS = 1_200;
const MAX_TRANSCRIPT_SEGMENT_CHARS = 700;
const MAX_TRANSCRIPT_SEGMENT_SECONDS = 45;

export function segmentsFromArticleText(text: string): ExtractedSegment[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .flatMap((paragraph) => splitLongParagraph(paragraph.trim()))
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length >= MIN_PARAGRAPH_CHARS);

  const segments: ExtractedSegment[] = [];
  let totalChars = 0;

  for (const paragraph of paragraphs) {
    if (totalChars >= MAX_SOURCE_CHARS) break;
    const remaining = MAX_SOURCE_CHARS - totalChars;
    const noiDung = paragraph.slice(0, remaining).trim();
    if (!noiDung) break;

    segments.push({
      thu_tu_doan: segments.length + 1,
      noi_dung: noiDung,
    });
    totalChars += noiDung.length;
  }

  return segments;
}

export function groupTranscriptSegments(segments: ExtractedSegment[]): ExtractedSegment[] {
  const grouped: ExtractedSegment[] = [];
  let currentTexts: string[] = [];
  let currentStart: number | undefined;
  let currentEnd: number | undefined;

  for (const segment of segments) {
    if (!segment.noi_dung.trim()) continue;

    if (currentStart === undefined) {
      currentStart = segment.giay_bat_dau;
    }

    currentTexts.push(segment.noi_dung.trim());
    currentEnd = segment.giay_ket_thuc;

    const text = currentTexts.join(" ");
    const duration = currentStart !== undefined && currentEnd !== undefined
      ? currentEnd - currentStart
      : 0;

    if (text.length >= MAX_TRANSCRIPT_SEGMENT_CHARS || duration >= MAX_TRANSCRIPT_SEGMENT_SECONDS) {
      grouped.push(createTranscriptGroup(grouped.length + 1, currentStart, currentEnd, currentTexts));
      currentTexts = [];
      currentStart = undefined;
      currentEnd = undefined;
    }
  }

  if (currentTexts.length > 0) {
    grouped.push(createTranscriptGroup(grouped.length + 1, currentStart, currentEnd, currentTexts));
  }

  return grouped;
}

export function fullTextFromSegments(segments: ExtractedSegment[]): string {
  return segments.map((segment) => segment.noi_dung).join("\n\n").slice(0, MAX_SOURCE_CHARS);
}

function splitLongParagraph(paragraph: string): string[] {
  if (paragraph.length <= MAX_PARAGRAPH_CHARS) return [paragraph];

  const sentences = paragraph.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (`${current} ${sentence}`.trim().length > MAX_PARAGRAPH_CHARS && current) {
      chunks.push(current);
      current = sentence;
      continue;
    }
    current = `${current} ${sentence}`.trim();
  }

  if (current) chunks.push(current);
  return chunks;
}

function createTranscriptGroup(
  order: number,
  start: number | undefined,
  end: number | undefined,
  texts: string[],
): ExtractedSegment {
  return {
    thu_tu_doan: order,
    giay_bat_dau: start,
    giay_ket_thuc: end,
    noi_dung: texts.join(" ").replace(/\s+/g, " ").trim(),
  };
}
