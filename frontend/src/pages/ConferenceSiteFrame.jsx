import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";

const CONFERENCE_BASE_PATH = "/conference/wc2ir-2026";
const CONFERENCE_ORIGIN = "https://ic2ins-2026.onrender.com";
const CONFERENCE_NAVIGATION_MESSAGE = "wc2ir:navigation";

function getRenderPathFromSynergyLocation(location) {
  const nestedPath = location.pathname.startsWith(CONFERENCE_BASE_PATH)
    ? location.pathname.slice(CONFERENCE_BASE_PATH.length) || "/"
    : "/";

  return `${nestedPath}${location.search}${location.hash}`;
}

function getSynergyPathFromRenderUrl(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const renderUrl = new URL(value, CONFERENCE_ORIGIN);

  if (renderUrl.origin !== CONFERENCE_ORIGIN) {
    return null;
  }

  const renderPath = `${renderUrl.pathname}${renderUrl.search}${renderUrl.hash}`;
  return renderPath === "/"
    ? CONFERENCE_BASE_PATH
    : `${CONFERENCE_BASE_PATH}${renderPath}`;
}

function ConferenceSiteFrame() {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeSrc = useMemo(
    () => `${CONFERENCE_ORIGIN}${getRenderPathFromSynergyLocation(location)}`,
    [location],
  );

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== CONFERENCE_ORIGIN) {
        return;
      }

      const data = event.data;

      if (
        !data ||
        typeof data !== "object" ||
        data.type !== CONFERENCE_NAVIGATION_MESSAGE
      ) {
        return;
      }

      try {
        const nextPath = getSynergyPathFromRenderUrl(data.href || data.path);
        const currentPath = `${location.pathname}${location.search}${location.hash}`;

        if (nextPath && nextPath !== currentPath) {
          navigate(nextPath);
        }
      } catch {
        // Ignore malformed navigation messages from the embedded site.
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [location.hash, location.pathname, location.search, navigate]);

  return (
    <>
      <Helmet>
        <title>WC2IR-2026 | Synergy World Press</title>
        <meta
          name="description"
          content="World Conference on Computational Intelligence and Robotics (WC2IR-2026)."
        />
        <link
          rel="canonical"
          href="https://synergyworldpress.com/conference/wc2ir-2026"
        />
      </Helmet>
      <main
        style={{
          height: "100vh",
          minHeight: "100vh",
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        <iframe
          src={iframeSrc}
          title="WC2IR-2026 conference website"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            border: 0,
          }}
          loading="eager"
        />
      </main>
    </>
  );
}

export default ConferenceSiteFrame;
