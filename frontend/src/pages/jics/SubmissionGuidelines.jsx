import React from 'react';

const SubmissionGuidelines = () => (
  <section className=" max-w-3xl mx-auto my-8  p-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Submission Guidelines
    </h2>
    
    <p className="text-[#212121] mb-8 text-lg leading-relaxed text-justify">
      We invite high-quality, original contributions that align with the scope of JICS, including research articles, review papers, case studies, and short communications in the field of intelligent computing systems.
    </p>

    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-[#00796b] mb-4">
          Manuscript Types Accepted:
        </h3>
        <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
          <li>
            <p className="text-justify">Original Research Articles</p>
          </li>
          <li>
            <p className="text-justify">Review Articles</p>
          </li>
          <li>
            <p className="text-justify">Case Studies</p>
          </li>
          <li>
            <p className="text-justify">Technical Notes</p>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-[#00796b] mb-4">
          Submission Format:
        </h3>
        <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
          <li>
            <p className="text-justify">
              Manuscripts must be submitted in Microsoft Word (DOC/DOCX) format in single column.
            </p>
          </li>
          <li>
            <p className="text-justify">
              Font: Times New Roman, Size 12, single-spaced.
            </p>
          </li>
          <li>
            <p className="text-justify">
              Follow APA referencing style.
            </p>
          </li>
          <li>
            <p className="text-justify">
              All figures and tables must be embedded within the main manuscript document at appropriate positions, not submitted as separate files.
            </p>
          </li>
          <li>
            <p className="text-justify">
              Table captions should appear above the respective tables, while figure captions should be placed below the corresponding figures. Each caption must be clearly numbered and descriptive.
            </p>
          </li>
          <li>
            <p className="text-justify">
              All figures and tables must be cited in the main text of the manuscript (e.g., "As shown in Figure 2..." or "Refer to Table 1…").
            </p>
          </li>
          <li>
            <p className="text-justify">
              Ensure that all visuals are of high quality and relevant to the content to support clarity and comprehension.
            </p>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-[#00796b] mb-4">
          Manuscript Structure:
        </h3>
        <ol className="list-decimal ml-6 text-[#212121] space-y-4 text-lg leading-relaxed">
          <li>
            <p className="text-justify">
              <span className="font-medium">Title Page</span>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-base">
                <li>Title of the paper</li>
                <li>Author(s) full name, affiliation, and email ID</li>
                <li>Corresponding author details</li>
              </ul>
            </p>
          </li>
          <li>
            <p className="text-justify">
              <span className="font-medium">Abstract</span>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-base">
                <li>150–250 words summarizing objectives, methods, results, and conclusion.</li>
                <li>Include 4–6 keywords.</li>
              </ul>
            </p>
          </li>
          <li>
            <p className="text-justify">
              <span className="font-medium">Main Body</span>
              <ul className="list-disc ml-6 mt-2 space-y-1 text-base">
                <li>Introduction</li>
                <li>Related Work (if applicable)</li>
                <li>Materials and Methods</li>
                <li>Results and Discussion</li>
                <li>Conclusion and Future Work</li>
              </ul>
            </p>
          </li>
          <li>
            <p className="text-justify">Acknowledgements (if any)</p>
          </li>
          <li>
            <p className="text-justify">References</p>
          </li>
          <li>
            <p className="text-justify">Appendices (optional)</p>
          </li>
        </ol>
      </div>
    </div>
  </section>
);

export default SubmissionGuidelines;
