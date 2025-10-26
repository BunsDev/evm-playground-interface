import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Playground from "@/components/playground";
import { transpileCode } from "@/lib/esbuild";
import { abiDb } from "@/lib/abiDatabase";

vi.mock("@/lib/esbuild", () => ({
  transpileCode: vi.fn(),
}));

vi.mock("@/lib/abiDatabase", () => {
  const orderBy = vi.fn(() => ({
    reverse: vi.fn(() => ({
      toArray: vi.fn(() => Promise.resolve([])),
    })),
  }));

  return {
    abiDb: { abis: { toArray: vi.fn(() => Promise.resolve([])) } },
    scriptDb: {
      scripts: {
        orderBy,
        update: vi.fn(() => Promise.resolve()),
        get: vi.fn(() => Promise.resolve(null)),
        add: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
      },
    },
  };
});

vi.mock("@/components/code-editor", () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => (
    <textarea data-testid="code-editor" value={value} readOnly />
  ),
}));

vi.mock("@/components/console-panel", () => ({
  __esModule: true,
  default: ({ logs }: { logs: { key: string; value: unknown }[] }) => (
    <div data-testid="console-panel">{logs.length} logs</div>
  ),
}));

const originalCreateElement = document.createElement.bind(document);
const originalAppendChild = document.body.appendChild.bind(document.body);
const originalRemoveChild = document.body.removeChild.bind(document.body);
const originalContains = document.body.contains.bind(document.body);

describe("Playground run workflow", () => {
  let restoreFns: Array<() => void> = [];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    vi.mocked(abiDb.abis.toArray).mockResolvedValue([]);
    restoreFns = [];

    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);

        if (tagName.toLowerCase() === "iframe") {
          const iframe = element as HTMLIFrameElement;
          const iframeDoc = document.implementation.createHTMLDocument("iframe");

          Reflect.defineProperty(iframe, "contentDocument", {
            configurable: true,
            value: iframeDoc,
          });

          Reflect.defineProperty(iframe, "contentWindow", {
            configurable: true,
            value: { document: iframeDoc },
          });

          Reflect.defineProperty(iframe, "srcdoc", {
            configurable: true,
            get() {
              return iframeDoc.documentElement.outerHTML;
            },
            set(value: string) {
              iframeDoc.open();
              iframeDoc.write(value);
              iframeDoc.close();
            },
          });

          return iframe;
        }

        return element;
      });
    restoreFns.push(() => createElementSpy.mockRestore());

    const appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node: Node) => {
        const result = originalAppendChild(node);
        const element = node as unknown as { tagName?: string; onload?: () => void };
        if (element?.tagName === "IFRAME") {
          queueMicrotask(() => {
            element.onload?.();
          });
        }
        return result;
      });
    restoreFns.push(() => appendChildSpy.mockRestore());

    const removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation((node: Node) => originalRemoveChild(node));
    restoreFns.push(() => removeChildSpy.mockRestore());

    const containsSpy = vi
      .spyOn(document.body, "contains")
      .mockImplementation((node: Node | null) => originalContains(node));
    restoreFns.push(() => containsSpy.mockRestore());
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    restoreFns.forEach((restore) => restore());
  });

  it("runs code successfully and resets state", async () => {
    vi.mocked(transpileCode).mockResolvedValueOnce("console.log('ok');");

    render(<Playground />);

    const runButton = screen.getByRole("button", { name: "Run" });

    fireEvent.click(runButton);

    expect(runButton).toBeDisabled();
    expect(runButton).toHaveTextContent("Running...");
    expect(transpileCode).toHaveBeenCalledTimes(1);

    await vi.runAllTimersAsync();

    await waitFor(() => {
      expect(runButton).not.toBeDisabled();
      expect(runButton).toHaveTextContent("Run");
    });
  });

  it("surfaces errors when execution fails", async () => {
    vi.mocked(transpileCode).mockRejectedValueOnce(new Error("transpile failure"));

    render(<Playground />);

    const runButton = screen.getByRole("button", { name: "Run" });

    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText(/transpile failure/i)).toBeInTheDocument();
    });

    await vi.runAllTimersAsync();

    await waitFor(() => {
      expect(runButton).not.toBeDisabled();
    });
  });
});
