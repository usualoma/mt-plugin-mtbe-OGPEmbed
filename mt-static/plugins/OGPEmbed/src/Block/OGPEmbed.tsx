import $ from "jquery";
import { t } from "../i18n";
import React, { useState, useEffect } from "mt-block-editor-block/React";
import { blockProperty } from "mt-block-editor-block/decorator";
import {
  BlockIframePreview,
  BlockSetupCommon,
  BlockLabel,
} from "mt-block-editor-block/Component";
import Block, {
  Metadata,
  NewFromHtmlOptions,
  EditorOptions,
} from "mt-block-editor-block/Block";

import icon from "../img/icon/ogpembed.svg";
import css from "../css/OGPEmbed.scss";

interface EditorProps {
  block: OGPEmbed;
}

interface HtmlProps {
  block: OGPEmbed;
}

interface OGPEmbedData {
  ogTitle: string;
  ogType: string;
  ogImage: string;
  ogUrl: string;
}

type Resolver = (params: { url: string }) => Promise<OGPEmbedData>;

const Editor: React.FC<EditorProps> = blockProperty(
  ({ block }: EditorProps) => (
    <div className={css.OGPEmbed}>
      <BlockSetupCommon block={block} keys={["label", "helpText"]} />
      <BlockLabel block={block}>
        <label className="mt-be-label-name">
          <div>{t("URL")}</div>
          <input type="url" name="url" data-mt-block-editor-focus-default />
        </label>
      </BlockLabel>
    </div>
  )
);

const Html: React.FC<HtmlProps> = ({ block }: HtmlProps) => {
  const [, setCompiledHtml] = useState("");

  useEffect(() => {
    (async () => {
      if (block.compiledHtml) {
        return;
      }

      await block.compile();
      setCompiledHtml(block.compiledHtml);
    })();
  });

  return block.compiledHtml ? (
    <BlockIframePreview
      key={block.id}
      block={block}
      header={`
<style type="text/css">
.ogpembed-card {
  margin: 10px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 5px;
  display: flex;
  text-decoration: none;
}
.ogpembed-card__image img {
  max-width: 200px;
  max-height: 200px;
  margin-right: 10px;
}
.ogpembed-card__text {
  line-height: 1.5
}
.ogpembed-card__title {
  color: initial;
  font-weight: bold;
}
.ogpembed-card__description {
  margin-top: 5px;
  color: initial;
  text-decoration: none;
}
.ogpembed-card__site-name {
  margin-top: 5px;
  font-size: 80%;
  color: gray;
  display: flex;
  align-items: center;
}
.ogpembed-card__icon {
  max-width: 13px;
  max-height: 13px;
  margin-right: 5px;
}
</style>
`}
      html={block.compiledHtml}
    />
  ) : block.url ? (
    <>{block.url}</>
  ) : (
    <span style={{ color: "gray" }}>
      {t("Please input URL to be resolved by oEmbed API")}
    </span>
  );
};

class OGPEmbed extends Block {
  public static typeId = "usualoma-ogpembed";
  public static selectable = true;
  public static shouldBeCompiled = true;
  public static icon = icon;
  public static get label(): string {
    return t("OGPEmbed");
  }

  public url = "";
  public icon: string | null = null;
  public ogType: string | null = null;
  public ogLocale: string | null = null;
  public ogTitle: string | null = null;
  public ogDescription: string | null = null;
  public ogImage: string | null = null;
  public ogUrl: string | null = null;
  public ogSiteName: string | null = null;

  private promises = new Map<string, Promise<void>>();

  public constructor(init?: Partial<OGPEmbed>) {
    super();
    if (init) {
      Object.assign(this, init);
    }
  }

  public metadata(): Metadata | null {
    return this.metadataByOwnKeys({
      keys: [
        "url",
        "icon",
        "ogType",
        "ogLocale",
        "ogTitle",
        "ogDescription",
        "ogImage",
        "ogUrl",
        "ogSiteName",
      ],
    });
  }

  public editor({ focus, focusBlock }: EditorOptions): JSX.Element {
    if (focus || focusBlock) {
      this.reset();
      return <Editor key={this.id} block={this} />;
    } else {
      return this.html();
    }
  }

  public html(): JSX.Element {
    return <Html key={this.id} block={this} />;
  }

  public async serializedString(): Promise<string> {
    return "";
  }

  public async compile(): Promise<void> {
    if (!this.url) {
      this.reset();
      return;
    }

    const resolver: Resolver = async ({ url }) => {
      return $.getJSON(
        `${location.origin}${window.CMSScriptURI}?__mode=ogpembed_resolve&url=${url}`
      ).then((data) => data);
    };
    try {
      const promise = (this.promises[this.url] ||= resolver({
        url: this.url,
      }));

      const res = await promise;

      this.icon = res.icon || "";
      this.ogType = res.ogType;
      this.ogLocale = res.ogLocale;
      this.ogTitle = res.ogTitle;
      this.ogDescription = res.ogDescription;
      this.ogImage = res.ogImage;
      this.ogUrl = res.ogUrl;
      this.ogSiteName = res.ogSiteName;

      const url = new URL(res.ogUrl || this.url);
      const name = url.hostname;
      const icon = this.icon.match(/^https?:/)
        ? this.icon
        : this.icon.match(/^\/[^\/]/)
        ? url.origin + this.icon
        : "";

      this.compiledHtml = `<a class="ogpembed-card" href="${this.ogUrl}">
  <div class="ogpembed-card__image">
    <img src="${this.ogImage}" />
  </div>
  <div class="ogpembed-card__text">
    <div class="ogpembed-card__title">${this.ogTitle}</div>
    <div class="ogpembed-card__description">${this.ogDescription}</div>
    <div class="ogpembed-card__site-name">
      ${icon ? `<img src="${icon}" class="ogpembed-card__icon">` : ""}
      ${name}
    </div>
  </div>
</a>`;
    } catch (e) {
      this.reset();
      this.compiledHtml = t(
        "Could not retrieve HTML for embedding from {{URL}}",
        {
          URL: this.url,
        }
      );
    }
  }

  public static async newFromHtml({
    meta,
    node,
  }: NewFromHtmlOptions): Promise<OGPEmbed> {
    const compiledHtml = node.hasAttribute("h") ? node.textContent : "";
    return new OGPEmbed(
      Object.assign({ compiledHtml }, meta as Partial<OGPEmbed>)
    );
  }

  private reset(): void {
    this.compiledHtml = "";
    this.icon = null;
    this.ogType = null;
    this.ogLocale = null;
    this.ogTitle = null;
    this.ogDescription = null;
    this.ogImage = null;
    this.ogUrl = null;
    this.ogSiteName = null;
  }
}

export default OGPEmbed;
