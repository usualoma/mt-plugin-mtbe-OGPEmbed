/* eslint-env node */
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = async function (_, env) {
  const isProd = env.mode === "production";

  return {
    mode: isProd ? "production" : "development",
    devtool: isProd ? "source-map" : "inline-source-map",
    entry: {
      "block.min": ["./mt-static/plugins/OGPEmbed/src/block.ts"],
    },
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      modules: ["node_modules", "mt-static/plugins/OGPEmbed/src"],
    },
    externals: {
      jquery: "jQuery",
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "[name].css",
        chunkFilename: "[id].css",
      }),
    ],
    output: {
      path: path.resolve(__dirname, "mt-static/plugins/OGPEmbed/dist"),
      filename: "[name].js",
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.(j|t)sx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.scss$/,
          use: [
            isProd ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: { modules: { namedExport: false } },
            },
            { loader: "postcss-loader", options: { sourceMap: isProd } },
          ],
        },
        { test: /\.svg$/, type: "asset/inline" },
      ],
    },
    watchOptions: {
      ignored: ["node_modules/**"],
    },
  };
};
