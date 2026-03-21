import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import mn from "./mn.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    mn: { translation: mn },
  },
  lng: localStorage.getItem("language") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
