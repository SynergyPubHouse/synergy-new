import React from 'react';
 const SubmissionGuidelines = () => (
  <section className="w-full max-w-6xl mx-auto my-8 px-6 py-8 lg:px-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Manuscript Submission Guidelines
    </h2>

    {/* Unnumbered title-page template from the document */}
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-[#00796b] mb-4">
        Title Page
      </h3>

      <p className="text-[#212121] mb-4 text-lg leading-relaxed text-justify">
        Submit the title page as a separate file using the following format:
      </p>

      <div className="border border-[#00796b]/30 p-6 text-[#212121] text-lg leading-relaxed">
        <h4 className="text-2xl font-bold text-[#00796b] mb-5 text-center">
          [INSERT YOUR FULL PAPERS TITLE HERE]
        </h4>

        <p className="text-center font-semibold mb-4">
          First Author Name 1, Second Author Name 2*
        </p>

        <div className="space-y-2 text-base">
          <p>
            1. Department of Medical Imaging, University Name, City,
            Postal Code, Country (Country Code)
          </p>

          <p>
            2. Department of Cardiovascular Medicine,
            Hospital/University Name, City, Postal Code, Country (Country Code)
          </p>
        </div>

        <div className="mt-6">
          <p className="font-semibold mb-1">Author Emails:</p>
          <p>firstauthor@university.edu, secondauthor@hospital.org</p>
        </div>

        <div className="mt-6">
          <p className="font-semibold mb-2">* Corresponding Author:</p>

          <div className="space-y-1">
            <p>Second Author Name</p>
            <p>
              Department of Cardiovascular Medicine, Hospital/University Name
            </p>
            <p>Full Mailing Address</p>
            <p>
              <span className="font-medium">Email:</span>{' '}
              secondauthor@hospital.org
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="space-y-8">
      {/* 1 */}
      <div>
        <h3 className="text-xl font-semibold text-[#00796b] mb-4">
          1. Submission Format &amp; Layout
        </h3>

        <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
          <li>
            <p className="text-justify">
              <span className="font-medium">File Format:</span> All manuscripts
              must be submitted in PDF format as a single-column document.
            </p>
          </li>

          <li>
            <p className="text-justify">
              <span className="font-medium">Typography:</span> Use Times New
              Roman, font size 10, with single line spacing (1.0).
            </p>
          </li>

          <li>
            <p className="text-justify">
              <span className="font-medium">Page Margins:</span> Use a normal
              page layout with 1-inch margins (2.54 cm) on all sides (top,
              bottom, left, and right).
            </p>
          </li>

          <li>
            <p className="text-justify">
              <span className="font-medium">
                Review Process (Double-Blind):
              </span>{' '}
              To ensure a fair peer-review process, all submissions must be
              entirely anonymized. Do not include author names, emails, or
              affiliations within the main manuscript file.
            </p>
          </li>
        </ul>
      </div>

      {/* 2 */}
      <div>
        <h3 className="text-xl font-semibold text-[#00796b] mb-4">
          2. Visuals: Figures and Tables
        </h3>

        <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
          <li>
            <p className="text-justify">
              <span className="font-medium">Placement:</span> All figures and
              tables must be embedded within the main text at their appropriate
              positions. Do not submit graphics or tables as separate files.
            </p>
          </li>

          <li>
            <p className="text-justify">
              <span className="font-medium">Quality:</span> Ensure all visual
              elements are high-resolution, clear, and directly support the
              comprehension of the text.
            </p>
          </li>

          <li>
            <p className="text-justify">
              <span className="font-medium">Citations:</span> Every figure and
              table must be explicitly cited chronologically within the body
              text, for example, &quot;As shown in Figure 2...&quot; or
              &quot;Refer to Table 1...&quot;.
            </p>
          </li>

          <li>
            <p className="text-justify">
              <span className="font-medium">
                Captions &amp; Numbering:
              </span>{' '}
              Each visual must include a clear, numbered, and descriptive
              caption.
            </p>

            <ul className="list-disc ml-6 mt-2 space-y-1 text-base">
              <li>Tables: Captions must appear above the table.</li>
              <li>Figures: Captions must appear below the figure.</li>
            </ul>
          </li>
        </ul>
      </div>

      {/* 3 */}
      <div>
        <h3 className="text-xl font-semibold text-[#00796b] mb-4">
          3. Manuscript Structure
        </h3>

        <p className="text-[#212121] mb-6 text-lg leading-relaxed text-justify">
          While authors may adapt headings slightly to suit their topic, the
          manuscript must align with the journal&apos;s core theme and generally
          follow this structure:
        </p>

        <div className="space-y-8">
          {/* 3.1 */}
          <div>
            <h4 className="text-xl font-semibold text-[#00796b] mb-4">
              3.1 Title Page (Submitted Separately for Review)
            </h4>

            <p className="text-[#212121] mb-4 text-lg leading-relaxed text-justify">
              To preserve the double-blind review process, submit this
              information in a separate title-page file:
            </p>

            <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
              <li>Full title of the paper</li>
              <li>Full names of all authors</li>
              <li>
                Complete institutional affiliations, including country codes
              </li>
              <li>Email addresses for all authors</li>
              <li>Clear designation of the corresponding author</li>
            </ul>
          </div>

          {/* 3.2 */}
          <div>
            <h4 className="text-xl font-semibold text-[#00796b] mb-4">
              3.2 Abstract &amp; Keywords
            </h4>

            <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
              <li>
                <p className="text-justify">
                  <span className="font-medium">Abstract:</span> A single
                  paragraph of 150–250 words summarizing the research
                  objectives, methods, key results, and primary conclusions.
                </p>
              </li>

              <li>
                <p className="text-justify">
                  <span className="font-medium">Keywords:</span> Provide 5–10
                  specific keywords for indexing purposes.
                </p>
              </li>
            </ul>
          </div>

          {/* 3.3 */}
          <div>
            <h4 className="text-xl font-semibold text-[#00796b] mb-4">
              3.3 Main Body (Varies by Article Type)
            </h4>

            <div className="space-y-8">
              {/* A */}
              <div>
                <h5 className="text-lg font-semibold text-[#212121] mb-3">
                  A. Introduction
                </h5>

                <ul className="list-disc ml-6 text-[#212121] space-y-2 text-lg leading-relaxed">
                  <li>Background context and motivation of the study</li>
                  <li>Identification of the research gap</li>
                  <li>Clear objectives or research questions</li>
                  <li>Significance and contribution of the study</li>
                </ul>
              </div>

              {/* B */}
              <div>
                <h5 className="text-lg font-semibold text-[#212121] mb-3">
                  B. Core Content Sections
                </h5>

                <p className="text-[#212121] mb-4 text-lg leading-relaxed text-justify">
                  The layout of this section depends entirely on your specific
                  article type:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-left text-base">
                    <thead>
                      <tr className="bg-[#00796b] text-white">
                        <th
                          scope="col"
                          className="border border-[#00796b] px-4 py-3 font-semibold"
                        >
                          Article Type
                        </th>

                        <th
                          scope="col"
                          className="border border-[#00796b] px-4 py-3 font-semibold"
                        >
                          Required Core Sections
                        </th>
                      </tr>
                    </thead>

                    <tbody className="text-[#212121]">
                      <tr>
                        <td className="border border-gray-300 px-4 py-3 font-medium align-top">
                          Research Article
                        </td>
                        <td className="border border-gray-300 px-4 py-3 align-top">
                          Methodology, Results, Discussion
                        </td>
                      </tr>

                      <tr>
                        <td className="border border-gray-300 px-4 py-3 font-medium align-top">
                          Review Article
                        </td>
                        <td className="border border-gray-300 px-4 py-3 align-top">
                          Search strategy, Thematic analysis, Synthesis
                        </td>
                      </tr>

                      <tr>
                        <td className="border border-gray-300 px-4 py-3 font-medium align-top">
                          Survey Article
                        </td>
                        <td className="border border-gray-300 px-4 py-3 align-top">
                          Dataset/criteria, Comparative analysis
                        </td>
                      </tr>

                      <tr>
                        <td className="border border-gray-300 px-4 py-3 font-medium align-top">
                          Case Study
                        </td>
                        <td className="border border-gray-300 px-4 py-3 align-top">
                          Case description, Analysis, Outcomes
                        </td>
                      </tr>

                      <tr>
                        <td className="border border-gray-300 px-4 py-3 font-medium align-top">
                          Short Communication
                        </td>
                        <td className="border border-gray-300 px-4 py-3 align-top">
                          Combined Methods + Key results
                        </td>
                      </tr>

                      <tr>
                        <td className="border border-gray-300 px-4 py-3 font-medium align-top">
                          Technical Note
                        </td>
                        <td className="border border-gray-300 px-4 py-3 align-top">
                          System/algorithm description, Validation
                        </td>
                      </tr>

                      <tr>
                        <td className="border border-gray-300 px-4 py-3 font-medium align-top">
                          Conceptual Paper
                        </td>
                        <td className="border border-gray-300 px-4 py-3 align-top">
                          Framework/model explanation
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* C */}
              <div>
                <h5 className="text-lg font-semibold text-[#212121] mb-3">
                  C. Discussion
                </h5>

                <ul className="list-disc ml-6 text-[#212121] space-y-2 text-lg leading-relaxed">
                  <li>Interpretation and meaning of the results</li>
                  <li>Comparison with existing literature</li>
                  <li>
                    Implications and limitations of the work (Note: This section
                    may be merged with the Results section if appropriate.)
                  </li>
                </ul>
              </div>

              {/* D */}
              <div>
                <h5 className="text-lg font-semibold text-[#212121] mb-3">
                  D. Conclusion
                </h5>

                <ul className="list-disc ml-6 text-[#212121] space-y-2 text-lg leading-relaxed">
                  <li>Summary of key findings</li>
                  <li>Clear statement of core contributions</li>
                  <li>Suggested directions for future research</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3.4 */}
          <div>
            <h4 className="text-xl font-semibold text-[#00796b] mb-4">
              3.4 Declarations &amp; Statements
            </h4>

            <p className="text-[#212121] mb-4 text-lg leading-relaxed text-justify">
              Include the following disclosures prior to the reference list:
            </p>

            <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
              <li>Ethical approval (if applicable)</li>
              <li>Conflict of interest statement</li>
              <li>Funding information and grant acknowledgments</li>
              <li>Data availability statement</li>
            </ul>
          </div>

          {/* 3.5 */}
          <div>
            <h4 className="text-xl font-semibold text-[#00796b] mb-4">
              3.5 References
            </h4>

            <p className="text-[#212121] mb-4 text-lg leading-relaxed text-justify">
              All sources must be formatted strictly according to the
              journal&apos;s referenced styles:
            </p>

            <ul className="list-disc ml-6 text-[#212121] space-y-4 text-lg leading-relaxed">
              <li>
                <p className="text-justify">
                  <span className="font-medium">Datasets:</span>{' '}
                  &quot;Padang Cuisine (Indonesian Food Image Dataset).&quot;
                  Accessed: Mar. 04, 2025. [Online]. Available:
                  https://www.kaggle.com/datasets/faldoae/padangfood
                </p>
              </li>

              <li>
                <p className="text-justify">
                  <span className="font-medium">Journal Articles:</span> S.
                  Kumar, R. Kumar, M. Gupta, K. Cengiz, and N. Ivković,
                  &quot;A Novel Approach for Classification and Detection of
                  Apple Leaf Disease Using Enhanced RBVT-Net With Transfer
                  Learning and YoloV7,&quot; IEEE Access, vol. 13, pp.
                  139953–139967, 2025, doi: 10.1109/ACCESS.2025.3596451.
                </p>
              </li>

              <li>
                <p className="text-justify">
                  <span className="font-medium">Books Chapter:</span> M.
                  Kumari, M. Gupta, and C. Ved, &quot;Blockchain in
                  Pharmaceutical Sector,&quot; Studies in Big Data, vol. 83,
                  pp. 199–220, 2021, doi:
                  10.1007/978-981-15-9547-9_8/SAVE-RESEARCH.
                </p>
              </li>

              <li>
                <p className="text-justify">
                  <span className="font-medium">Newsletters:</span>{' '}
                  &quot;Creating a Healthier Home | NIH News in Health.&quot;
                  Accessed: Jun. 24, 2026. [Online]. Available:
                  https://newsinhealth.nih.gov/2026/06/creating-healthier-home.
                </p>
              </li>
            </ul>
          </div>

          {/* 3.6 */}
          <div>
            <h4 className="text-xl font-semibold text-[#00796b] mb-4">
              3.6 Optional Sections (Include Only When Required)
            </h4>

            <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
              <li>Acknowledgements</li>
              <li>Appendices</li>
              <li>Supplementary Material</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default SubmissionGuidelines;
