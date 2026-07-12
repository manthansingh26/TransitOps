/**
 * Compatibility shim.
 *
 * The app previously used TanStack Start server functions wrapped with
 * `useServerFn`. Now that the data layer calls the FastAPI backend directly
 * via plain async functions, this shim simply returns the function unchanged
 * so existing call sites (`const fn = useServerFn(x); fn(args)`) keep working.
 */
export function useServerFn<T>(fn: T): T {
  return fn;
}
