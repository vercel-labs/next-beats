import type { ArtworkKind } from './artwork-motif';

export type CoverStudioOptions = {
  detail: number;
  height: number;
  kind: ArtworkKind;
  label: string;
  seed: string;
  turn: number;
  width: number;
};

export type CoverStudioWindow = Window & {
  __coverStudioError?: string;
  __coverStudioReady?: boolean;
  __renderCoverFrame?: (options: CoverStudioOptions) => Promise<string>;
};
