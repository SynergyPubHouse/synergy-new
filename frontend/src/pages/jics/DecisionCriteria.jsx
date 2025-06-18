import React from 'react';

const DecisionCriteria = () => (
  <section className=" max-w-3xl mx-auto my-8  p-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Decision Criteria
    </h2>
    
    <p className="text-[#212121] mb-8 text-lg leading-relaxed text-justify">
      Editorial decisions are based on the following key criteria:
    </p>

    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
          <h3 className="text-xl font-semibold text-[#00796b] mb-3">Originality and Novelty</h3>
          <p className="text-[#212121] leading-relaxed text-justify">
            The research contribution must demonstrate originality and bring new insights to the field.
          </p>
        </div>

        <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
          <h3 className="text-xl font-semibold text-[#00796b] mb-3">Technical Quality</h3>
          <p className="text-[#212121] leading-relaxed text-justify">
            Evaluation of methodology, analysis, and accuracy of the research.
          </p>
        </div>

        <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
          <h3 className="text-xl font-semibold text-[#00796b] mb-3">Relevance</h3>
          <p className="text-[#212121] leading-relaxed text-justify">
            The work must align with the scope and focus areas of the journal.
          </p>
        </div>

        <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
          <h3 className="text-xl font-semibold text-[#00796b] mb-3">Clarity and Coherence</h3>
          <p className="text-[#212121] leading-relaxed text-justify">
            The writing must be clear, well-structured, and effectively communicate the research.
          </p>
        </div>
      </div>

      <div className="bg-[#e0f7fa] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00acc1] mb-3">Significance and Impact</h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          Assessment of the potential impact and contribution to the field of intelligent computing systems.
        </p>
      </div>

      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">Decision Categories</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <span className="w-24 font-medium text-green-700">Accept:</span>
            <span className="flex-1 text-[#212121] leading-relaxed text-justify">
              Manuscript is accepted for publication with minor or no revisions.
            </span>
          </div>
          <div className="flex items-start">
            <span className="w-24 font-medium text-blue-600">Minor Revision:</span>
            <span className="flex-1 text-[#212121] leading-relaxed text-justify">
              Manuscript requires minor changes before acceptance.
            </span>
          </div>
          <div className="flex items-start">
            <span className="w-24 font-medium text-amber-600">Major Revision:</span>
            <span className="flex-1 text-[#212121] leading-relaxed text-justify">
              Significant changes are required before reconsideration.
            </span>
          </div>
          <div className="flex items-start">
            <span className="w-24 font-medium text-red-600">Reject:</span>
            <span className="flex-1 text-[#212121] leading-relaxed text-justify">
              Manuscript is not suitable for publication in its current form.
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default DecisionCriteria;
