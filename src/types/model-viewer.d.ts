import type { CSSProperties, DetailedHTMLProps, HTMLAttributes } from "react";

type ModelViewerAttributes = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  alt?: string;
  ar?: boolean;
  autoplay?: boolean;
  exposure?: string;
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
  ["shadow-intensity"]?: string;
  ["touch-action"]?: string;
};

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}
