import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const CONFERENCE_BASE_PATH = "/conference/wc2ir-2026";
const CONFERENCE_ORIGIN = "https://ic2ins-2026.onrender.com";

function ConferenceSiteFrame() {
  const location = useLocation();
  const nestedPath = location.pathname.startsWith(CONFERENCE_BASE_PATH)
    ? location.pathname.slice(CONFERENCE_BASE_PATH.length) || "/"
    : "/";
  const iframeSrc = `${CONFERENCE_ORIGIN}${nestedPath}${location.search}${location.hash}`;

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
