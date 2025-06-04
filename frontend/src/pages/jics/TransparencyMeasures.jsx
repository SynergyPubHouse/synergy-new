import React from 'react';

const TransparencyMeasures = () => (
  <section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8">
    <h2 className="text-2xl font-bold text-indigo-900 mb-6">Transparency Measures</h2>
    
    <p className="text-gray-700 mb-6">
      To ensure fairness and transparency in our peer review process, we implement the following measures:
    </p>

    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Reviewer Selection</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Reviewers are selected based on their expertise and research background</li>
          <li>No conflicts of interest with authors or their institutions</li>
          <li>Diverse representation from different geographical regions and institutions</li>
          <li>Regular rotation of reviewers to prevent bias</li>
        </ul>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Review Process</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Structured review forms with clear evaluation criteria</li>
          <li>Detailed feedback provided to authors for all decisions</li>
          <li>Opportunity for authors to respond to reviewer comments</li>
          <li>Editorial oversight to ensure consistency in review quality</li>
        </ul>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Quality Control</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Regular monitoring of review timelines and quality</li>
          <li>Feedback mechanism for authors to report concerns</li>
          <li>Periodic review of editorial decisions for consistency</li>
          <li>Continuous improvement of review guidelines and processes</li>
        </ul>
      </div>

      <div className="bg-indigo-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Appeals Process</h3>
        <p className="text-gray-700 mb-4">
          Authors have the right to appeal editorial decisions. Appeals must be submitted within 30 days of the decision and should include:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Clear explanation of the grounds for appeal</li>
          <li>Point-by-point response to reviewer comments</li>
          <li>Additional information or clarification if relevant</li>
          <li>Professional and constructive tone</li>
        </ul>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Publication Ethics</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Clear policies on authorship and contributions</li>
          <li>Transparent handling of conflicts of interest</li>
          <li>Rigorous plagiarism detection</li>
          <li>Open communication about retractions or corrections</li>
        </ul>
      </div>
    </div>
  </section>
);

export default TransparencyMeasures; 