import i18n from "i18n";

const localesDirectory = "/locales";

i18n.configure({
  locales: ["en", "fr", "jp"],
  directory: localesDirectory,
  defaultLocale: "en",
  objectNotation: true,
});

export default i18n;