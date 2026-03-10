import React from 'react';

const TransparencyMeasures = () => (
  <section className=" max-w-3xl mx-auto my-8  p-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Transparency Measures
    </h2>

    <p className="text-[#212121] mb-8 text-lg leading-relaxed text-justify">
      To ensure fairness and transparency in our peer review process, we implement the following measures:
    </p>

    <div className="space-y-8">
      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">
          Reviewer Selection
        </h3>
        <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
          <li>
            <p className="text-justify">Reviewers are selected based on their expertise and research background</p>
          </li>
          <li>
            <p className="text-justify">No conflicts of interest with authors or their institutions</p>
          </li>
          <li>
            <p className="text-justify">Diverse representation from different geographical regions and institutions</p>
          </li>
          <li>
            <p className="text-justify">Regular rotation of reviewers to prevent bias</p>
          </li>
        </ul>
      </div>

      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">
          Review Process
        </h3>
        <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
          <li>
            <p className="text-justify">Structured review forms with clear evaluation criteria</p>
          </li>
          <li>
            <p className="text-justify">Detailed feedback provided to authors for all decisions</p>
          </li>
          <li>
            <p className="text-justify">Opportunity for authors to respond to reviewer comments</p>
          </li>
          <li>
            <p className="text-justify">Editorial oversight to ensure consistency in review quality</p>
          </li>
        </ul>
      </div>

      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">
          Quality Control
        </h3>
        <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
          <li>
            <p className="text-justify">Regular monitoring of review timelines and quality</p>
          </li>
          <li>
            <p className="text-justify">Feedback mechanism for authors to report concerns</p>
          </li>
          <li>
            <p className="text-justify">Periodic review of editorial decisions for consistency</p>
          </li>
          <li>
            <p className="text-justify">Continuous improvement of review guidelines and processes</p>
          </li>
        </ul>
      </div>

      <div className="bg-[#e0f7fa] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00acc1] mb-3">
          Appeals Process
        </h3>
        <p className="text-[#212121] mb-4 leading-relaxed text-justify">
          Authors have the right to appeal editorial decisions. Appeals must be submitted within 30 days of the decision and should include:
        </p>
        <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
          <li>
            <p className="text-justify">Clear explanation of the grounds for appeal</p>
          </li>
          <li>
            <p className="text-justify">Point-by-point response to reviewer comments</p>
          </li>
          <li>
            <p className="text-justify">Additional information or clarification if relevant</p>
          </li>
          <li>
            <p className="text-justify">Professional and constructive tone</p>
          </li>
        </ul>
      </div>

      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">
          Publication Ethics
        </h3>
        <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
          <li>
            <p className="text-justify">Clear policies on authorship and contributions</p>
          </li>
          <li>
            <p className="text-justify">Transparent handling of conflicts of interest</p>
          </li>
          <li>
            <p className="text-justify">Rigorous plagiarism detection</p>
          </li>
          <li>
            <p className="text-justify">Open communication about retractions or corrections</p>
          </li>
        </ul>
      </div>
    </div>
  </section>
);

export default TransparencyMeasures;
