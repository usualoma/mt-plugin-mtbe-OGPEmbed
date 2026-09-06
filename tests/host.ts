import { vi } from "vitest";

export function createHost() {
  return {
    Block: class {
      public id = "test-block";
      public compiledHtml = "";
    },
    React: {
      createElement: vi.fn(
        (type: unknown, props: Record<string, unknown> | null) => ({
          type,
          props,
        })
      ),
      useState: vi.fn(),
      useEffect: vi.fn(),
      useRef: vi.fn(),
    },
    Component: {},
    decorator: { blockProperty: (component: unknown) => component },
    i18n: {
      on: vi.fn<(event: string, callback: () => void) => void>(),
      addResourceBundle: vi.fn(),
      t: vi.fn().mockReturnValue("translated"),
    },
    registerBlockType: vi.fn(),
  };
}
