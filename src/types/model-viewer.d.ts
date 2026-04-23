import type { CSSProperties, DetailedHTMLProps, HTMLAttributes } from "react";

type ModelViewerAttributes = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  alt?: string;
  ar?: boolean;
  ["ar-scale"]?: string;
  autoplay?: boolean;
  ["camera-orbit"]?: string;
  ["camera-target"]?: string;
  exposure?: string;
  ["field-of-view"]?: string;
  ["interaction-prompt-style"]?: string;
  ["interpolation-decay"]?: string;
  ["orbit-sensitivity"]?: string;
  poster?: string;
  src?: string;
  slot?: string;
  style?: CSSProperties;
  ["auto-rotate"]?: boolean;
  ["ar-modes"]?: string;
  ["camera-controls"]?: boolean;
  ["environment-image"]?: string;
  ["interaction-prompt"]?: string;
  ["ios-src"]?: string;
  ["max-camera-orbit"]?: string;
  ["max-field-of-view"]?: string;
  ["min-camera-orbit"]?: string;
  ["min-field-of-view"]?: string;
  ["shadow-intensity"]?: string;
  ["touch-action"]?: string;
  ["zoom-sensitivity"]?: string;
};

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}
