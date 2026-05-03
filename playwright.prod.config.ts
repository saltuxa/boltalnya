import baseConfig from "./playwright.config";

export default {
  ...baseConfig,
  webServer: {
    ...baseConfig.webServer,
    command: "yarn build && yarn start"
  }
};
