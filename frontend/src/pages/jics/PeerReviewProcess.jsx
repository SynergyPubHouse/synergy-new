import React from 'react';

const PeerReviewProcess = () => (
  <section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8">
    <h2 className="text-2xl font-bold text-indigo-900 mb-6">Peer Review Process</h2>
    
    <div className="space-y-6">
      <div className="bg-indigo-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-4">Double-Blind Peer Review</h3>
        <p className="text-gray-700">
          Journal of Intelligent Computing System(JICS) follows a double-blind peer review process, ensuring the anonymity of both authors and reviewers to maintain objectivity and fairness. Each manuscript is reviewed by at least two independent reviewers who are experts in the field relevant to the submission.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-indigo-800">Key Features of Our Review Process:</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-3">
          <li>Double-blind review ensures unbiased evaluation</li>
          <li>Minimum of two expert reviewers per manuscript</li>
          <li>Reviewers selected based on expertise in the relevant field</li>
          <li>Comprehensive evaluation of research quality and methodology</li>
          <li>Constructive feedback for authors</li>
        </ul>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-4">Benefits of Double-Blind Review</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Eliminates potential bias based on author identity</li>
          <li>Ensures focus on research quality and content</li>
          <li>Promotes fair and objective evaluation</li>
          <li>Maintains high academic standards</li>
        </ul>
      </div>
    </div>
  </section>
);

export default PeerReviewProcess; 