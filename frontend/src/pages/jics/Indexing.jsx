const indexingBodies = [
  {
    name: "Google Scholar",
    logo: (
      <img
        src="/images/google_scholar_logo.png"
        alt="Google Scholar"
        className="w-24 h-16 object-contain"
      />
    ),
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    accentColor: "border-blue-400",
    description:
      "JICS articles are indexed in Google Scholar, enabling broad discoverability across the global academic community. Readers can search, cite, and track citations directly through Google Scholar.",
    link: "https://scholar.google.com",
    linkLabel: "Visit Google Scholar",
    badge: "Indexed",
  },
  {
    name: "CrossRef",
    logo: (
      <img
        src="/images/cross_ref_logo.png"
        alt="CrossRef"
        className="w-24 h-16 object-contain"
      />
    ),
    badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
    accentColor: "border-orange-400",
    description:
      "All published articles receive a unique Digital Object Identifier (DOI) through CrossRef, ensuring persistent access, proper citation linking, and long-term archiving of scholarly content.",
    link: "https://www.crossref.org",
    linkLabel: "Visit CrossRef",
    badge: "DOI Registered",
  },
];

const Indexing = () => (
  <section className="w-full max-w-6xl mx-auto my-8 px-6 py-8 lg:px-8">
    {/* Page Header */}
    <div className="mb-10">
      <h2 className="text-3xl font-extrabold text-[#00796b] mb-3 tracking-tight">
        Indexing
      </h2>
      <p className="text-[#555] text-lg leading-relaxed max-w-2xl">
        The Journal of Intelligent Computing System (JICS) is committed to
        maximizing the visibility and reach of published research. Articles are
        indexed in leading academic databases to ensure broad discoverability.
      </p>
    </div>

    {/* Indexing Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      {indexingBodies.map((body) => (
        <div
          key={body.name}
          className={`bg-white rounded-2xl shadow-md border-l-4 ${body.accentColor} p-7 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-200`}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-gray-50 rounded-xl p-2 shadow-sm">
              {body.logo}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#212121]">{body.name}</h3>
              <span
                className={`inline-block mt-1 text-xs font-semibold px-3 py-0.5 rounded-full border ${body.badgeColor}`}
              >
                {body.badge}
              </span>
            </div>
          </div>
          <p className="text-[#444] text-base leading-relaxed">
            {body.description}
          </p>
          <a
            href={body.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#00796b] hover:text-[#00acc1] transition-colors mt-auto"
          >
            {body.linkLabel}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      ))}
    </div>

    {/* Summary Note */}
    <div className="bg-[#e0f7f4] border border-[#b2dfdb] rounded-xl p-6 flex gap-4 items-start">
      <div className="flex-shrink-0 mt-0.5">
        <svg
          className="w-6 h-6 text-[#00796b]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
          />
        </svg>
      </div>
      <p className="text-[#333] text-sm leading-relaxed">
        Indexing helps researchers, institutions, and funding bodies locate and
        evaluate published work. JICS continuously works to expand its indexing
        coverage. Authors can expect their accepted articles to appear in
        indexed databases within a few weeks of publication.
      </p>
    </div>
  </section>
);

export default Indexing;
