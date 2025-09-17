import { useState, useCallback, useMemo } from "react";

// Example translations (could be external JSON files)
const dictionaries = {
  en: {
    common: {
      hello: "Hello, {name}!",
      welcome: "Welcome to our platform",
    },
    auth: {
      login: {
        title: "Login to your account",
        button: "Sign In",
      },
    },
  },
  es: {
    common: {
      hello: "¡Hola, {name}!",
      welcome: "Bienvenido a nuestra plataforma",
    },
    auth: {
      login: {
        title: "Inicia sesión en tu cuenta",
        button: "Entrar",
      },
    },
  },
};

export default function useI18n({
  defaultLang = "en",
  fallbackLang = "en",
  resources = dictionaries,
} = {}) {
  const [lang, setLang] = useState(defaultLang);

  // Helper: safely resolve nested keys (dot notation)
  const resolveKey = (obj, path) => {
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  };

  // Main translator function
  const t = useCallback(
    (key, vars = {}) => {
      const currentDict = resources[lang] || {};
      const fallbackDict = resources[fallbackLang] || {};

      let value =
        resolveKey(currentDict, key) ?? resolveKey(fallbackDict, key) ?? key;

      // Interpolate variables
      if (typeof value === "string") {
        value = value.replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? `{${v}}`);
      }
      return value;
    },
    [lang, resources, fallbackLang]
  );

  // Memoized API for components
  return useMemo(
    () => ({
      t,
      lang,
      setLang,
      availableLangs: Object.keys(resources),
    }),
    [t, lang, resources]
  );
}
