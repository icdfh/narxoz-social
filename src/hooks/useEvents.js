import { useCallback, useEffect, useState } from "react";
import apiClient from "../utils/apiClient";

/**
 * Хук хранит set(id) активных подписок и даёт методы subscribe / unsubscribe
 */
export function useMySubscriptions() {
  const [subs, setSubs] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get(
          "/events/my/active-subscriptions/"
        );
        // DRF-пагинация: {count, results, next, …}
        const list = Array.isArray(data) ? data : data.results || [];
        setSubs(new Set(list.map((s) => s.event.id)));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const subscribe = useCallback(async (eventId) => {
    await apiClient.post(`/events/subscribe/${eventId}/`);
    setSubs((prev) => new Set(prev).add(eventId));
  }, []);

  const unsubscribe = useCallback(async (eventId) => {
    await apiClient.post(`/events/unsubscribe/${eventId}/`);
    setSubs((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  }, []);

  return { subs, loading, subscribe, unsubscribe };
}
