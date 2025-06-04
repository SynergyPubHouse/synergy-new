import React from 'react';

const DecisionCriteria = () => (
  <section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8">
    <h2 className="text-2xl font-bold text-indigo-900 mb-6">Decision Criteria</h2>
    
    <p className="text-gray-700 mb-6">
      Editorial decisions are based on the following key criteria:
    </p>

    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-800 mb-3">Originality and Novelty</h3>
          <p className="text-gray-700">
            The research contribution must demonstrate originality and bring new insights to the field.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-800 mb-3">Technical Quality</h3>
          <p className="text-gray-700">
            Evaluation of methodology, analysis, and accuracy of the research.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-800 mb-3">Relevance</h3>
          <p className="text-gray-700">
            The work must align with the scope and focus areas of the journal.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-800 mb-3">Clarity and Coherence</h3>
          <p className="text-gray-700">
            The writing must be clear, well-structured, and effectively communicate the research.
          </p>
        </div>
      </div>

      <div className="bg-indigo-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Significance and Impact</h3>
        <p className="text-gray-700">
          Assessment of the potential impact and contribution to the field of intelligent computing systems.
        </p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Decision Categories</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="w-24 font-medium text-green-700">Accept:</span>
            <span className="text-gray-700">Manuscript is accepted for publication with minor or no revisions.</span>
          </div>
          <div className="flex items-center">
            <span className="w-24 font-medium text-blue-700">Minor Revision:</span>
            <span className="text-gray-700">Manuscript requires minor changes before acceptance.</span>
          </div>
          <div className="flex items-center">
            <span className="w-24 font-medium text-yellow-700">Major Revision:</span>
            <span className="text-gray-700">Significant changes are required before reconsideration.</span>
          </div>
          <div className="flex items-center">
            <span className="w-24 font-medium text-red-700">Reject:</span>
            <span className="text-gray-700">Manuscript is not suitable for publication in its current form.</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default DecisionCriteria; 