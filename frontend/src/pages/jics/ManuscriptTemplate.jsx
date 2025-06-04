import React from 'react';

const ManuscriptTemplate = () => (
  <section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8">
    <h2 className="text-2xl font-bold text-indigo-900 mb-6">Manuscript Template</h2>
    
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <p className="text-yellow-700">
        The JICS Manuscript Template will be available for download soon. Please check back later or contact our editorial team for the current template.
      </p>
    </div>

    <p className="text-gray-700">
      The template will include all necessary formatting guidelines and styles to help authors prepare their manuscripts according to JICS requirements. It will be provided in Microsoft Word format and will include:
    </p>

    <ul className="list-disc ml-6 text-gray-700 mt-4 space-y-2">
      <li>Pre-formatted styles for headings, body text, and references</li>
      <li>Proper margins and page setup</li>
      <li>Example tables and figures</li>
      <li>Reference formatting examples</li>
      <li>Title page template</li>
    </ul>
  </section>
);

export default ManuscriptTemplate; 