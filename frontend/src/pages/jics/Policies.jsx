import React from "react";

const reviewSteps = [
  {
    number: "01",
    title: "Initial Editorial Screening",
    description:
      "Manuscripts are first assessed by the editorial team for scope fit, completeness, and basic quality standards before entering the formal review pipeline.",
  },
  {
    number: "02",
    title: "Similarity Check",
    description:
      "Each submission undergoes a plagiarism and similarity check using industry-standard tools to ensure originality and academic integrity.",
  },
  {
    number: "03",
    title: "Assignment to Expert Reviewers",
    description:
      "The editor assigns the manuscript to two or more subject-matter experts with relevant domain knowledge.",
  },
  {
    number: "04",
    title: "Double-Blind Peer Review",
    description:
      "Reviewers evaluate the manuscript without knowledge of the authors' identities, and authors are not informed of reviewer identities — ensuring unbiased assessment.",
  },
  {
    number: "05",
    title: "Editorial Decision",
    description: null,
    decisions: [
      { label: "Accept", color: "bg-green-100 text-green-700 border-green-300" },
      { label: "Minor Revision", color: "bg-blue-100 text-blue-700 border-blue-300" },
      { label: "Major Revision", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
      { label: "Reject", color: "bg-red-100 text-red-700 border-red-300" },
    ],
  },
  {
    number: "06",
    title: "Final Editorial Assessment",
    description:
      "After revisions (if any), the editor-in-chief conducts a final review to confirm the manuscript meets all quality and ethical requirements.",
  },
  {
    number: "07",
    title: "Publication",
    description:
      "Accepted manuscripts are formatted, assigned a DOI, and published open-access on the JICS platform.",
  },
];

const Policies = () => (
  <section className="w-full max-w-6xl mx-auto my-8 px-6 py-8 lg:px-8">
    {/* Page Header */}
    <div className="mb-10">
      <h2 className="text-3xl font-extrabold text-[#00796b] mb-3 tracking-tight">
        Policies
      </h2>
      <p className="text-[#555] text-lg leading-relaxed max-w-2xl">
        JICS is committed to transparent, fair, and rigorous editorial
        standards. The following policies govern all aspects of publication,
        from submission to post-publication.
      </p>
    </div>

    {/* APC Section */}
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-10">
      <div className="bg-[#00796b] px-7 py-4 flex items-center gap-3">
        <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-white font-bold text-lg">
          Article Processing Charges (APC)
        </h3>
      </div>
      <div className="px-7 py-6">
        {/* APC Badge */}
        <div className="flex items-center gap-4 mb-5">
          <span className="text-4xl font-extrabold text-[#00796b]">₹0</span>
          <span className="inline-block bg-green-100 text-green-700 border border-green-300 text-sm font-semibold px-4 py-1 rounded-full">
            No APC
          </span>
        </div>
        <p className="text-[#444] text-base leading-relaxed mb-4">
          The journal is committed to promoting high-quality scholarly research
          and currently publishes all accepted articles <strong>free of charge</strong>.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 flex gap-3 items-start">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-[#555] leading-relaxed">
            If the journal's funding model changes in the future, any revision to
            the APC policy will be announced on the journal website in advance and
            will apply <strong>only to new submissions received after the effective date</strong>.
          </p>
        </div>
      </div>
    </div>

    {/* Review Procedure Section */}
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-[#00796b] px-7 py-4 flex items-center gap-3">
        <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <h3 className="text-white font-bold text-lg">Review Procedure</h3>
      </div>
      <div className="px-7 py-6">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-[#b2dfdb] hidden sm:block" aria-hidden="true" />

          <ol className="space-y-6">
            {reviewSteps.map((step, idx) => (
              <li key={step.number} className="relative flex gap-5 sm:gap-6">
                {/* Step number bubble */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00796b] text-white flex items-center justify-center font-bold text-sm shadow-md z-10">
                  {step.number}
                </div>
                {/* Content */}
                <div className="flex-1 bg-[#f9f9f9] rounded-xl px-5 py-4 border border-gray-100">
                  <h4 className="font-semibold text-[#212121] text-base mb-1">
                    {step.title}
                  </h4>
                  {step.description && (
                    <p className="text-[#555] text-sm leading-relaxed">
                      {step.description}
                    </p>
                  )}
                  {step.decisions && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {step.decisions.map((d) => (
                        <span
                          key={d.label}
                          className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${d.color}`}
                        >
                          {d.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
    {/* Retraction and Correction Policy */}
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-10">
      <div className="bg-[#00796b] px-7 py-4 flex items-center gap-3">
        <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <h3 className="text-white font-bold text-lg">Retraction and Correction Policy</h3>
      </div>
      <div className="px-7 py-6">
        <p className="text-[#444] text-base leading-relaxed mb-4">
          JICS reserves the right to retract, correct, or remove published articles when any of the following are established:
        </p>
        <ul className="space-y-2 mb-5">
          {[
            "Research misconduct is proven",
            "Plagiarism is detected after publication",
            "Fabricated or falsified data is identified",
            "Serious ethical violations are discovered",
            "Significant errors that invalidate the findings",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-[#555]">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-[#00796b] flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <div className="bg-[#e0f2f1] border border-[#b2dfdb] rounded-lg px-5 py-3 text-sm text-[#00796b] font-medium">
          Retractions and corrections are conducted in accordance with{" "}
          <a href="https://publicationethics.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#004d40]">
            COPE guidelines
          </a>.
        </div>
      </div>
    </div>

    {/* Data Availability Policy */}
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-10">
      <div className="bg-[#00796b] px-7 py-4 flex items-center gap-3">
        <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <h3 className="text-white font-bold text-lg">Data Availability Policy</h3>
      </div>
      <div className="px-7 py-6">
        <p className="text-[#444] text-base leading-relaxed mb-4">
          Authors are encouraged to make research data available whenever possible to
          support reproducibility and transparency. A <strong>Data Availability Statement</strong> must
          be included in the manuscript indicating:
        </p>
        <ul className="space-y-2">
          {[
            "Where the data can be accessed (repository link or contact details)",
            "Any restrictions on access and the reasons for them",
            "A clear statement if data cannot be shared, with justification",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-[#555]">
              <svg className="w-4 h-4 text-[#00796b] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* AI-Assisted Writing Policy */}
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-10">
      <div className="bg-[#00796b] px-7 py-4 flex items-center gap-3">
        <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="text-white font-bold text-lg">AI-Assisted Writing Policy</h3>
      </div>
      <div className="px-7 py-6">
        <p className="text-[#444] text-base leading-relaxed mb-4">
          Authors may use Artificial Intelligence (AI) tools to improve language,
          grammar, and readability of their manuscripts. However, the following
          conditions apply:
        </p>
        <ul className="space-y-3 mb-5">
          {[
            { text: "AI tools cannot be listed as authors", type: "restrict" },
            { text: "Authors remain fully responsible for all content, accuracy, and originality", type: "restrict" },
            { text: "Any substantial use of AI-assisted writing tools must be disclosed in the manuscript", type: "restrict" },
          ].map(({ text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-[#555]">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
              {text}
            </li>
          ))}
        </ul>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 flex gap-3 items-start">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-[#555] leading-relaxed">
            JICS reserves the right to screen submissions for excessive AI-generated
            content and may reject manuscripts that fail to meet scholarly and
            originality standards.
          </p>
        </div>
      </div>
    </div>

    {/* Archiving Policy */}
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-10">
      <div className="bg-[#00796b] px-7 py-4 flex items-center gap-3">
        <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <h3 className="text-white font-bold text-lg">Archiving Policy</h3>
      </div>
      <div className="px-7 py-6">
        <p className="text-[#444] text-base leading-relaxed mb-4">
          JICS is committed to ensuring the long-term preservation and accessibility
          of all published content. Published articles may be archived through:
        </p>
        <ul className="space-y-2">
          {[
            "Institutional repositories",
            "Author personal repositories",
            "National libraries",
            "Third-party archiving services",
            "Journal archives maintained by Synergy World Press",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-[#555]">
              <svg className="w-4 h-4 text-[#00796b] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Conflict of Interest Policy */}
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-10">
      <div className="bg-[#00796b] px-7 py-4 flex items-center gap-3">
        <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
        <h3 className="text-white font-bold text-lg">Conflict of Interest Policy</h3>
      </div>
      <div className="px-7 py-6">
        <p className="text-[#444] text-base leading-relaxed mb-4">
          Authors, reviewers, and editors must disclose any financial, professional,
          institutional, or personal relationships that could influence the
          publication process.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          {[
            { role: "Authors", desc: "Disclose funding sources, affiliations, or competing interests at submission" },
            { role: "Reviewers", desc: "Declare any relationship with the authors or their institutions before accepting a review" },
            { role: "Editors", desc: "Recuse themselves from handling manuscripts where a conflict exists" },
          ].map(({ role, desc }) => (
            <div key={role} className="bg-[#f9f9f9] rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-[#00796b] uppercase tracking-wider mb-1">{role}</p>
              <p className="text-sm text-[#555] leading-snug">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-[#555] leading-relaxed">
          All disclosed conflicts will be evaluated by the editorial office before
          a final decision is made.
        </p>
      </div>
    </div>

  </section>
);

export default Policies;
