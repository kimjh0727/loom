import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface UseTerminalOptions {
  onData?: (data: string) => void;
}

export function useTerminal(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseTerminalOptions = {}
) {
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // 터미널 초기화
  useEffect(() => {
    if (!containerRef.current || termRef.current) return;

    const term = new Terminal({
      theme: {
        background: "#0e0e11",
        foreground: "#e8e8f0",
        cursor: "#7c6af7",
        cursorAccent: "#0e0e11",
        selectionBackground: "rgba(124, 106, 247, 0.3)",
        black: "#1e1e24",
        red: "#f87171",
        green: "#4ade80",
        yellow: "#fbbf24",
        blue: "#60a5fa",
        magenta: "#c084fc",
        cyan: "#34d399",
        white: "#e8e8f0",
        brightBlack: "#55556a",
        brightRed: "#fca5a5",
        brightGreen: "#86efac",
        brightYellow: "#fde68a",
        brightBlue: "#93c5fd",
        brightMagenta: "#d8b4fe",
        brightCyan: "#6ee7b7",
        brightWhite: "#f8f8ff",
      },
      fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 5000,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    // PTY 연결 전 로컬 에코 (Phase 2-E에서 PTY로 교체)
    term.onData((data) => {
      if (options.onData) {
        options.onData(data);
      } else {
        term.write(data);
      }
    });

    term.writeln("\x1b[1;35mLoom\x1b[0m \x1b[2m— terminal ready\x1b[0m");
    term.writeln("");

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    return () => {
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // 리사이즈 옵저버
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const write = useCallback((data: string) => {
    termRef.current?.write(data);
  }, []);

  const writeln = useCallback((data: string) => {
    termRef.current?.writeln(data);
  }, []);

  const getDimensions = useCallback(() => {
    const term = termRef.current;
    if (!term) return { cols: 80, rows: 24 };
    return { cols: term.cols, rows: term.rows };
  }, []);

  return { write, writeln, getDimensions, termRef, fitAddonRef };
}
