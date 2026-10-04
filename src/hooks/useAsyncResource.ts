import { useCallback, useEffect, useRef, useState } from "react";

type ResourceLoader<T> = (signal: AbortSignal, force: boolean) => Promise<T>;
type ResourceState<T> = { value: T; loading: boolean; error: string | null; loader: ResourceLoader<T> };

const loadResource = async <T>(
  loader: ResourceLoader<T>, controller: AbortController, force: boolean,
  initialValue: T, setState: (state: ResourceState<T>) => void,
) => {
  try {
    const value = await loader(controller.signal, force);
    if (!controller.signal.aborted) setState({ value, loading: false, error: null, loader });
  } catch (error) {
    if (!controller.signal.aborted) setState({ value: initialValue, loading: false,
      error: error instanceof Error ? error.message : "Unknown error", loader });
  }
};

export const useAsyncResource = <T>(loader: ResourceLoader<T>, initialValue: T) => {
  const [state, setState] = useState<ResourceState<T>>({
    value: initialValue, loading: true, error: null, loader,
  });
  const [reloadToken, setReloadToken] = useState(0);
  const previousReloadToken = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const force = previousReloadToken.current !== reloadToken;
    previousReloadToken.current = reloadToken;
    setState({ value: initialValue, loading: true, error: null, loader });
    void loadResource(loader, controller, force, initialValue, setState);
    return () => controller.abort();
  }, [initialValue, loader, reloadToken]);
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);
  const currentState = state.loader === loader ? state
    : { value: initialValue, loading: true, error: null };
  return { ...currentState, reload };
};
