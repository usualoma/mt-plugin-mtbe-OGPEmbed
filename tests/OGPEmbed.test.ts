import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHost } from "./host";

const { getJSON } = vi.hoisted(() => ({ getJSON: vi.fn() }));
vi.mock("jquery", () => ({ default: { getJSON } }));

const host = createHost();
Object.assign(window, {
  MTBlockEditor: host,
  CMSScriptURI: "/cgi-bin/mt.cgi",
});

const { default: OGPEmbed } = await import(
  "../mt-static/plugins/OGPEmbed/src/Block/OGPEmbed"
);

const ogp = {
  icon: "/favicon.ico",
  ogType: "website",
  ogTitle: "Example title",
  ogDescription: "Example description",
  ogImage: "https://example.com/image.png",
  ogUrl: "https://example.com/article",
  ogSiteName: "Example",
};

beforeEach(() => {
  getJSON.mockReset().mockResolvedValue(ogp);
});

describe("OGPEmbed", () => {
  it("registers the block through the entry point", async () => {
    await import("../mt-static/plugins/OGPEmbed/src/block");

    expect(host.registerBlockType).toHaveBeenCalledWith(OGPEmbed);
    expect(OGPEmbed.typeId).toBe("usualoma-ogpembed");
  });

  it("renders JSX using the host React instance", () => {
    const block = new OGPEmbed();

    block.editor({ focus: true });

    expect(host.React.createElement).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ block, key: block.id })
    );
  });

  it("resolves an OGP card and reuses the request for the same URL", async () => {
    const block = new OGPEmbed({ url: "https://example.com/article" });

    await Promise.all([block.compile(), block.compile()]);

    expect(getJSON).toHaveBeenCalledExactlyOnceWith(
      `${location.origin}/cgi-bin/mt.cgi?__mode=ogpembed_resolve&url=${block.url}`
    );
    expect(block.ogTitle).toBe(ogp.ogTitle);
    expect(block.compiledHtml).toContain('href="https://example.com/article"');
    expect(block.compiledHtml).toContain("Example title");
    expect(block.compiledHtml).toContain(
      'src="https://example.com/favicon.ico"'
    );
  });

  it("uses the input URL to resolve the icon when og:url is missing", async () => {
    getJSON.mockResolvedValue({ ...ogp, ogUrl: "" });
    const block = new OGPEmbed({ url: "https://fallback.example/article" });

    await block.compile();

    expect(block.compiledHtml).toContain("fallback.example");
    expect(block.compiledHtml).toContain(
      'src="https://fallback.example/favicon.ico"'
    );
  });

  it("clears the card without a request when the URL is empty", async () => {
    const block = new OGPEmbed({
      compiledHtml: "old card",
      ogTitle: "old title",
    });

    await block.compile();

    expect(getJSON).not.toHaveBeenCalled();
    expect(block.compiledHtml).toBe("");
    expect(block.ogTitle).toBeNull();
  });

  it("clears stale OGP data and translates resolver failures", async () => {
    getJSON.mockRejectedValue(new Error("Network error"));
    const block = new OGPEmbed({
      url: "https://example.com/article",
      ogTitle: "old title",
    });

    await block.compile();

    expect(block.ogTitle).toBeNull();
    expect(block.compiledHtml).toBe("translated");
    expect(
      host.i18n.t
    ).toHaveBeenCalledWith(
      "Could not retrieve HTML for embedding from {{URL}}",
      { URL: block.url }
    );
  });
});
