import React from 'react';

const EthicalGuidelines = () => (
  <section className=" max-w-3xl mx-auto my-8  p-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Ethical Guidelines & Plagiarism Policy
    </h2>
    
    <p className="text-[#212121] mb-8 text-lg leading-relaxed text-justify">
      The Journal of Intelligent Computing System (JICS) upholds the highest standards of academic integrity and ethical publishing practices. Authors submitting to JICS must adhere to the following guidelines:
    </p>

    <div className="space-y-6">
      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">Originality</h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          All submissions must be original works that have not been previously published or concurrently submitted elsewhere.
        </p>
      </div>

      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">Exclusivity</h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          Manuscripts under review by JICS should not be submitted to any other journal or conference simultaneously.
        </p>
      </div>

      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">Conflict of Interest</h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          Authors are required to disclose any potential conflicts of interest—financial, professional, or personal—that may influence the research or its interpretation.
        </p>
      </div>

      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">Plagiarism & Misconduct</h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          JICS maintains a zero-tolerance policy toward plagiarism, data fabrication, and unethical research practices. Any manuscript found to violate these principles will be rejected immediately and may lead to further disciplinary action.
        </p>
      </div>
    </div>

    <p className="text-[#212121] mt-8 italic text-lg leading-relaxed text-justify">
      We are committed to ensuring the integrity of the scholarly record and expect the same level of commitment from all contributors.
    </p>
  </section>
);

export default EthicalGuidelines;
