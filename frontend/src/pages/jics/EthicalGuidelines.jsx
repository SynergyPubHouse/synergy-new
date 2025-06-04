import React from 'react';

const EthicalGuidelines = () => (
  <section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8">
    <h2 className="text-2xl font-bold text-indigo-900 mb-6">Ethical Guidelines & Plagiarism Policy</h2>
    
    <p className="text-gray-700 mb-6">
      The Journal of Intelligent Computing System (JICS) upholds the highest standards of academic integrity and ethical publishing practices. Authors submitting to JICS must adhere to the following guidelines:
    </p>

    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-indigo-800 mb-2">Originality</h3>
        <p className="text-gray-700">
          All submissions must be original works that have not been previously published or concurrently submitted elsewhere.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-indigo-800 mb-2">Exclusivity</h3>
        <p className="text-gray-700">
          Manuscripts under review by JICS should not be submitted to any other journal or conference simultaneously.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-indigo-800 mb-2">Conflict of Interest</h3>
        <p className="text-gray-700">
          Authors are required to disclose any potential conflicts of interest—financial, professional, or personal—that may influence the research or its interpretation.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-indigo-800 mb-2">Plagiarism & Misconduct</h3>
        <p className="text-gray-700">
          JICS maintains a zero-tolerance policy toward plagiarism, data fabrication, and unethical research practices. Any manuscript found to violate these principles will be rejected immediately and may lead to further disciplinary action.
        </p>
      </div>
    </div>

    <p className="text-gray-700 mt-6 italic">
      We are committed to ensuring the integrity of the scholarly record and expect the same level of commitment from all contributors.
    </p>
  </section>
);

export default EthicalGuidelines; 