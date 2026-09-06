// @vitest-environment node
import { runInNewContext } from "node:vm";
import { build } from "vite";
import { expect, it, vi } from "vitest";
import type OGPEmbed from "../mt-static/plugins/OGPEmbed/src/Block/OGPEmbed";
import { createHost } from "./host";

it.each(["production", "development"])(
  "builds a standalone plugin in %s mode with the existing filenames and host globals",
  async (mode) => {
    const result = await build({
      mode,
      logLevel: "silent",
      build: { write: false },
    });
    const bundle = Array.isArray(result) ? result[0] : result;
    if (!("output" in bundle)) {
      throw new Error("Expected a single build output");
    }

    const script = bundle.output.find(
      (file) => file.fileName === "block.min.js"
    );
    const stylesheet = bundle.output.find(
      (file) => file.fileName === "block.min.css"
    );
    expect(script?.type).toBe("chunk");
    expect(stylesheet?.type).toBe("asset");
    if (script?.type !== "chunk" || stylesheet?.type !== "asset") {
      throw new Error("Missing plugin JavaScript or CSS");
    }

    const host = createHost();
    const getJSON = vi.fn().mockResolvedValue({
      ogTitle: "Bundled card",
      ogUrl: "https://example.com/article",
    });
    runInNewContext(script.code, {
      window: { MTBlockEditor: host, CMSScriptURI: "/cgi-bin/mt.cgi" },
      jQuery: { getJSON },
      location: { origin: "https://cms.example.com" },
      URL,
    });

    expect(host.registerBlockType).toHaveBeenCalledTimes(1);
    const Block = host.registerBlockType.mock.calls[0][0] as typeof OGPEmbed;
    expect(Block.typeId).toBe("usualoma-ogpembed");
    expect(Block.icon).toMatch(/^data:image\/svg\+xml/);
    expect(String(stylesheet.source)).toMatch(
      /\.[\w-]+\s+input\s*\{\s*width:\s*100%/
    );
    const selector = String(stylesheet.source).match(/\.([\w-]+)/);
    expect(selector).not.toBeNull();
    expect(script.code).toContain(selector?.[1]);

    const block = new Block({ url: "https://example.com/article" });
    block.editor({ focus: true });
    expect(host.React.createElement).toHaveBeenCalled();
    await block.compile();
    expect(getJSON).toHaveBeenCalledExactlyOnceWith(
      "https://cms.example.com/cgi-bin/mt.cgi?__mode=ogpembed_resolve&url=https://example.com/article"
    );
    expect(block.compiledHtml).toContain("Bundled card");

    const initializeTranslations = host.i18n.on.mock.calls[0][1];
    initializeTranslations();
    expect(host.i18n.addResourceBundle).toHaveBeenCalledWith(
      "ja",
      "translation",
      expect.objectContaining({ MTImage: "画像" }),
      true,
      false
    );
  }
);
