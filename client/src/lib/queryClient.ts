import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Attempt to parse as JSON first, fallback to text
    let errorDetails;
    try {
      errorDetails = await res.json();
      console.error('Response error details:', errorDetails);
    } catch (e) {
      const text = await res.text();
      console.error('Response error text:', text);
      errorDetails = text || res.statusText;
    }
    
    if (typeof errorDetails === 'object') {
      throw new Error(`${res.status}: ${JSON.stringify(errorDetails)}`);
    } else {
      throw new Error(`${res.status}: ${errorDetails}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`);
  if (data) {
    console.log('Request data:', data);
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    console.log(`Response status: ${res.status}`);
    
    // Clone the response before checking it
    // (since response body can only be consumed once)
    const resClone = res.clone();
    
    await throwIfResNotOk(res);
    
    // Try to log the response data for debugging
    try {
      const responseBody = await resClone.json();
      console.log('Response data:', responseBody);
    } catch (e) {
      console.log('Response is not JSON or already consumed');
    }
    
    return resClone;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Query function called with key:`, queryKey);
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      console.log(`Query response status: ${res.status} for ${queryKey[0]}`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('Returning null for unauthorized response');
        return null;
      }

      // Clone response before processing
      const resClone = res.clone();
      
      await throwIfResNotOk(res);
      
      const data = await resClone.json();
      console.log('Query response data:', data);
      return data;
    } catch (error) {
      console.error(`Query error for ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
