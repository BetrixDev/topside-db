import { useEffect, useRef } from "react";
import { orpc } from "@/utils/orpc";

type ResourceType =
  | "item"
  | "quest"
  | "hideoutStation"
  | "map"
  | "arc"
  | "trader";

export function usePageView(
  resourceType: ResourceType,
  resourceId: string,
  isEnabled: boolean = true
) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current || !isEnabled) return;

    const trackView = async () => {
      try {
        await orpc.analytics.trackView.call({
          resourceType,
          resourceId,
        });
        hasTracked.current = true;
      } catch (err) {
        console.debug("Failed to track view:", err);
      }
    };

    const timeout = setTimeout(trackView, 2500);

    return () => {
      clearTimeout(timeout);
    };
  }, [resourceType, resourceId, isEnabled]);
}
