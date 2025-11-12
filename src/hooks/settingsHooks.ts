// src/lib/settingsHooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppSettings, getSettings, updateSettings, uploadFavicon } from "../services/settingsApi.ts";

export function useSettings() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: getSettings, staleTime: 60_000 });

  const save = useMutation({
    mutationFn: (payload: AppSettings) => updateSettings(payload),
    onSuccess: (data) => {
      qc.setQueryData(["settings"], data);
    }
  });

  const uploadFav = useMutation({
    mutationFn: (f: File) => uploadFavicon(f),
  });

  return { ...q, save, uploadFav };
}
