import React from 'react';

const AcademicIntegrity = () => (
  <section className="bg-white max-w-3xl mx-auto my-8 rounded-2xl shadow-md border border-[#e0e0e0] p-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Commitment to Academic Integrity
    </h2>
    
    <p className="text-[#212121] mb-8 text-lg leading-relaxed">
      At the Journal of Intelligent Computing System (JICS), we uphold the highest standards of academic integrity and ethical publishing. We are committed to:
    </p>

    <ul className="list-disc ml-6 text-[#212121] space-y-4 mb-8 text-lg leading-relaxed">
      <li>
        <span className="font-semibold text-[#00796b]">Ensuring originality:</span> All submissions undergo rigorous plagiarism checks using industry-standard tools.
      </li>
      <li>
        <span className="font-semibold text-[#00796b]">Transparent peer review:</span> We follow a double-blind peer review process to ensure fairness, objectivity, and confidentiality.
      </li>
      <li>
        <span className="font-semibold text-[#00796b]">Adhering to ethical guidelines:</span> JICS aligns with the guidelines set by the Committee on Publication Ethics (COPE) and expects all authors, reviewers, and editors to comply with ethical standards in research and publishing.
      </li>
      <li>
        <span className="font-semibold text-[#00796b]">Responsible authorship:</span> Authorship should reflect a significant contribution to the work. Ghostwriting, honorary authorship, and data fabrication are strictly prohibited.
      </li>
      <li>
        <span className="font-semibold text-[#00796b]">Conflict of interest disclosure:</span> Authors and reviewers must disclose any potential conflicts to maintain transparency.
      </li>
      <li>
        <span className="font-semibold text-[#00796b]">Research integrity:</span> We expect accurate reporting of methods, results, and sources, ensuring that all research complies with institutional and international research ethics policies.
      </li>
    </ul>

    <p className="text-[#212121] italic text-lg leading-relaxed">
      We believe that maintaining academic integrity not only protects the scholarly record but also builds trust within the research community.
    </p>
  </section>
);

export default AcademicIntegrity;
