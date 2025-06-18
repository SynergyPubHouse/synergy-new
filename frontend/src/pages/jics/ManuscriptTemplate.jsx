import React from 'react';

const ManuscriptTemplate = () => (
  <section className=" max-w-3xl mx-auto my-8  p-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Manuscript Template
    </h2>
    
<div className="bg-[#e0f7fa] border-l-4 border-[#00acc1] p-6 rounded-lg mb-8 d-flex items-center">
  <p className="text-[#00796b] font-medium leading-relaxed text-justify">
    <a 
      href="/sample.docx" 
      download 
      className="text-[#004d40] hover:text-[#004d40] hover:bg-[#b2dfdb] font-semibold px-4 py-2 rounded transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-105 inline-block"
    >
      Click Here to Get the Template
    </a>
  </p>
</div>


    <p className="text-[#212121] text-lg leading-relaxed text-justify">
      The template will include all necessary formatting guidelines and styles to help authors prepare their manuscripts according to JICS requirements. It will be provided in Microsoft Word format and will include:
    </p>

    <ul className="list-disc ml-6 text-[#212121] mt-6 space-y-3 text-lg leading-relaxed">
      <li>Pre-formatted styles for headings, body text, and references</li>
      <li>Proper margins and page setup</li>
      <li>Example tables and figures</li>
      <li>Reference formatting examples</li>
      <li>Title page template</li>
    </ul>
  </section>
);

export default ManuscriptTemplate;
