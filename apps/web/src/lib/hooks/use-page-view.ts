import { useEffect, useRef } from "react";
import { orpc } from "@/utils/orpc";

type ResourceType = "item" | "quest" | "hideout" | "map";

export function usePageView(resourceType: ResourceType, resourceId: string) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;

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
  }, [resourceType, resourceId]);
}
