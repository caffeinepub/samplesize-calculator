import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Calculation, StudyType, SubType } from "../backend";
import { useActor } from "./useActor";

export function useRecentCalculations() {
  const { actor, isFetching } = useActor();
  return useQuery<Calculation[]>({
    queryKey: ["recentCalculations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentCalculations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCalculation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      studyType: StudyType;
      subType: SubType;
      inputDescription: string;
      resultN: number;
    }) => {
      if (!actor) return;
      const timestamp = BigInt(Date.now());
      await actor.saveCalculation(
        params.studyType,
        params.subType,
        params.inputDescription,
        params.resultN,
        timestamp,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentCalculations"] });
    },
  });
}

export { StudyType, SubType };
export type { Calculation };
