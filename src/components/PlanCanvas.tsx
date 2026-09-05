import { Excalidraw } from "@excalidraw/excalidraw";
import type {
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { useEffect, useRef } from "react";
import "@excalidraw/excalidraw/index.css";

interface PlanCanvasProps {
  elements: readonly ExcalidrawElement[];
}

export function PlanCanvas({ elements }: PlanCanvasProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  useEffect(() => {
    if (apiRef.current) {
      apiRef.current.updateScene({ elements });
      apiRef.current.scrollToContent(elements, { fitToContent: true });
    }
  }, [elements]);

  return (
    <div className="plan-canvas">
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api;
        }}
        initialData={{
          elements,
          appState: { viewBackgroundColor: "#ffffff" },
        }}
      />
    </div>
  );
}
