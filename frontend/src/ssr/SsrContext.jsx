/* eslint-disable react-refresh/only-export-components -- shared SSR context also exports its hook and URL helper */
import { createContext, useContext } from "react";
import PropTypes from "prop-types";
import {
  DEFAULT_SITE_URL,
  normalizeSiteUrl,
} from "../../ssr/config.js";
const SsrContext = createContext({
  initialData: null,
  publicSiteUrl: DEFAULT_SITE_URL,
});

export function SsrProvider({ initialData, children }) {
  const publicSiteUrl = String(
    initialData?.config?.publicSiteUrl ||
      import.meta.env.VITE_PUBLIC_SITE_URL ||
      DEFAULT_SITE_URL,
  );

  return (
    <SsrContext.Provider value={{ initialData, publicSiteUrl: normalizeSiteUrl(publicSiteUrl) }}>
      {children}
    </SsrContext.Provider>
  );
}

SsrProvider.propTypes = {
  initialData: PropTypes.object,
  children: PropTypes.node.isRequired,
};

SsrProvider.defaultProps = {
  initialData: null,
};

export function useSsrContext() {
  return useContext(SsrContext);
}
