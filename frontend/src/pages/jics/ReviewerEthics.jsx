import React from 'react';

const ReviewerEthics = () => (
  <section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8">
    <h2 className="text-2xl font-bold text-indigo-900 mb-6">Reviewer Ethics</h2>
    
    <p className="text-gray-700 mb-6">
      Reviewers must adhere to the highest standards of academic ethics and confidentiality:
    </p>

    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Confidentiality</h3>
        <p className="text-gray-700">
          Maintain confidentiality of the manuscript and review content. All information and materials related to the review process must be kept strictly confidential.
        </p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Objectivity</h3>
        <p className="text-gray-700">
          Provide objective, constructive, and unbiased evaluations. Reviews should be based solely on the scientific merit of the work, without personal bias or prejudice.
        </p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Conflict of Interest</h3>
        <p className="text-gray-700">
          Avoid conflicts of interest. Reviewers must decline the review if a potential conflict exists. This includes personal, professional, or financial relationships that could influence the review.
        </p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Ethical Use</h3>
        <p className="text-gray-700">
          Refrain from using the manuscript content for personal advantage. Reviewers must not use any information, data, or ideas from the manuscript for their own research or other purposes.
        </p>
      </div>

      <div className="bg-indigo-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Additional Responsibilities</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
          <li>Provide timely and constructive feedback</li>
          <li>Identify potential ethical issues or concerns</li>
          <li>Maintain professional communication with editors</li>
          <li>Respect author confidentiality</li>
        </ul>
      </div>
    </div>
  </section>
);

export default ReviewerEthics; 