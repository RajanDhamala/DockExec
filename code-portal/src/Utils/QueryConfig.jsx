import { QueryClient } from "@tanstack/react-query";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                     // retry failed queries once
      refetchOnWindowFocus: false,  // don't refetch when tab gets focus
      staleTime: 1000 * 60,         // 1 minute: query considered fresh
      gcTime: 1000 * 60 * 5,        // 5 minutes: unused queries stay in cache before garbage collection
    },
    mutations: {
      retry: 1,
    },
  },
});

export default queryClient;
