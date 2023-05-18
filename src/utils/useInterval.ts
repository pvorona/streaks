import { useEffect, useRef } from "react";
import { noop } from "./noop";

type Callback = () => void;

export function useInterval(callback: Callback, interval: number) {
  const savedCallback = useRef<Callback>(noop);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval]);
}
