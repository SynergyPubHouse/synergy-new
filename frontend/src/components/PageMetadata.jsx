import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";
import { useSsrContext } from "../ssr/SsrContext.jsx";
import { buildCanonicalUrl } from "../../ssr/config.js";

function PageMetadata({
  title,
  description,
  pathname,
  noindex = false,
  openGraphType = "website",
  includeCanonical = true,
}) {
  const { publicSiteUrl } = useSsrContext();
  const canonicalUrl = buildCanonicalUrl(publicSiteUrl, pathname);
  const meaningfulDescription = String(description || "").trim();

  return (
    <Helmet>
      <title>{title}</title>
      {meaningfulDescription && (
        <meta name="description" content={meaningfulDescription} />
      )}
      <meta name="robots" content={noindex ? "noindex, follow" : "index, follow"} />
      {includeCanonical && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:title" content={title} />
      {meaningfulDescription && (
        <meta property="og:description" content={meaningfulDescription} />
      )}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={openGraphType} />
      <meta property="og:site_name" content="Synergy World Press" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      {meaningfulDescription && (
        <meta name="twitter:description" content={meaningfulDescription} />
      )}
    </Helmet>
  );
}

PageMetadata.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  pathname: PropTypes.string.isRequired,
  noindex: PropTypes.bool,
  openGraphType: PropTypes.string,
  includeCanonical: PropTypes.bool,
};

export default PageMetadata;
