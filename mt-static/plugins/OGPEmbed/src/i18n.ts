import i18n from "mt-block-editor-block/i18n";

const translations = import.meta.glob<Record<string, string>>(
  "./locales/*/translation.json",
  { eager: true, import: "default" }
);

i18n.on("initialized", () => {
  Object.entries(translations).forEach(([path, translation]) => {
    const lang = path.split("/")[2];
    i18n.addResourceBundle(lang, "translation", translation, true, false);
  });
});

export function t(
  args: string | string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>
): string {
  return i18n.t(args, params);
}
