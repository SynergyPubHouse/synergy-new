import React from 'react';

const ReviewTimeline = () => (
  <section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8">
    <h2 className="text-2xl font-bold text-indigo-900 mb-6">Review Timeline</h2>
    
    <div className="space-y-8">
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Initial Screening</h3>
        <p className="text-gray-700">
          Within 7–10 days of submission to check scope, formatting, and ethical compliance.
        </p>
      </div>

      <div className="bg-green-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-3">Peer Review</h3>
        <p className="text-gray-700">
          Typically completed within 4–6 weeks, depending on reviewer availability and complexity of the manuscript.
        </p>
      </div>

      <div className="bg-purple-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-800 mb-3">Revision & Final Decision</h3>
        <p className="text-gray-700">
          Authors are given 2–3 weeks to address reviewer comments. The final decision is usually communicated within 60 days of the initial submission.
        </p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Total Timeline</h3>
        <div className="space-y-2">
          <p className="text-gray-700">
            <span className="font-medium">Best Case:</span> 45-60 days from submission to final decision
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Average Case:</span> 60-90 days from submission to final decision
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Note:</span> Timeline may vary based on manuscript complexity and reviewer availability
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default ReviewTimeline; 