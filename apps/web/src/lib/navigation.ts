import { useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useParams as useTanStackParams,
  useRouter as useTanStackRouter,
} from "@tanstack/react-router";

type Router = {
  push: (to: string) => void;
  replace: (to: string) => void;
  prefetch: (to: string) => void;
  back: () => void;
};

export function useRouter(): Router {
  const navigate = useNavigate();
  const router = useTanStackRouter();

  return useMemo(
    () => ({
      push: (to: string) => {
        void navigate({ to });
      },
      replace: (to: string) => {
        void navigate({ to, replace: true });
      },
      prefetch: (to: string) => {
        void router.preloadRoute({ to });
      },
      back: () => {
        window.history.back();
      },
    }),
    [navigate, router],
  );
}

export function usePathname() {
  return useLocation({
    select: (location) => location.pathname,
  });
}

export function useSearchParams() {
  const location = useLocation();

  return useMemo(() => {
    if (typeof window === "undefined") {
      return new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
  }, [location]);
}

export function useParams<T extends Record<string, string>>() {
  const params = useTanStackParams({ strict: false });
  return params as T;
}
