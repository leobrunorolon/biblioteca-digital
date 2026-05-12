import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Invalida queries específicas cada vez que la pantalla recibe el foco.
 * Útil para que los datos se actualicen al volver de otra pantalla.
 */
export function useRefreshOnFocus(queryKeys: string[][]) {
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    }, [])
  );
}
