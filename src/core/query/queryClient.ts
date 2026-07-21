import { QueryClient } from "@tanstack/react-query";
import { UnauthorizedError } from "../api/client";

// Don't retry auth failures (the client already tried a refresh); retry other
// transient errors twice. staleTime keeps list/detail data warm between screens.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !(error instanceof UnauthorizedError) && failureCount < 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false
    }
  }
});
