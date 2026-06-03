export type ContentSourceType = "youtube" | "bai_bao" | "podcast" | "thu_cong";

export type ExtractedSegment = {
  thu_tu_doan: number;
  giay_bat_dau?: number;
  giay_ket_thuc?: number;
  noi_dung: string;
};

export type ExtractedContent = {
  loai: ContentSourceType;
  url: string;
  tieu_de: string;
  tac_gia?: string;
  url_anh_bia?: string;
  thoi_luong_giay?: number;
  ngon_ngu: string;
  ban_ghi_loi: string;
  doans: ExtractedSegment[];
};

export type ContentExtractor = {
  extract(): Promise<ExtractedContent>;
};

export type ContentExtractionErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_SOURCE_TYPE"
  | "NO_TRANSCRIPT"
  | "ARTICLE_EXTRACTION_FAILED"
  | "ARTICLE_TOO_SHORT"
  | "FETCH_TIMEOUT";

export class ContentExtractionError extends Error {
  constructor(
    public readonly code: ContentExtractionErrorCode,
    message: string,
    public readonly status = 422,
  ) {
    super(message);
    this.name = "ContentExtractionError";
  }
}
