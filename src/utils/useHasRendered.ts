import { useState, useEffect } from "react";

export function useHasRendered() {
  const [hasRendered, setRendered] = useState(false);

  useEffect(() => {
    setRendered(true);
  }, []);

  return hasRendered;
}
