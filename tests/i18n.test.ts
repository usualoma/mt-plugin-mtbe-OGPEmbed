import { expect, it, vi } from "vitest";
import en from "../mt-static/plugins/OGPEmbed/src/locales/en/translation.json";
import ja from "../mt-static/plugins/OGPEmbed/src/locales/ja/translation.json";

const i18n = vi.hoisted(() => ({
  on: vi.fn(),
  addResourceBundle: vi.fn(),
  t: vi.fn(),
}));
vi.mock("mt-block-editor-block/i18n", () => ({ default: i18n }));

it("loads translation JSON with Vite and registers both locales on initialization", async () => {
  await import("../mt-static/plugins/OGPEmbed/src/i18n");

  expect(i18n.addResourceBundle).not.toHaveBeenCalled();
  expect(i18n.on).toHaveBeenCalledWith("initialized", expect.any(Function));
  i18n.on.mock.calls[0][1]();

  expect(i18n.addResourceBundle).toHaveBeenCalledTimes(2);
  expect(i18n.addResourceBundle).toHaveBeenCalledWith(
    "en",
    "translation",
    en,
    true,
    false
  );
  expect(i18n.addResourceBundle).toHaveBeenCalledWith(
    "ja",
    "translation",
    ja,
    true,
    false
  );
});

it("passes translation keys and interpolation values to the host", async () => {
  const { t } = await import("../mt-static/plugins/OGPEmbed/src/i18n");
  i18n.t.mockReturnValue("Translated text");

  expect(t("Key", { URL: "https://example.com" })).toBe("Translated text");
  expect(i18n.t).toHaveBeenCalledWith("Key", { URL: "https://example.com" });
});
