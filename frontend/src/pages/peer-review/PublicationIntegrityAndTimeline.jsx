import React from 'react';
import Layout from '../../components/Layout';

const PublicationIntegrityAndTimeline = () => (
  <Layout>
    <section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8 border border-[#e0e0e0]">
      <h2 className="text-2xl font-bold text-[#00796b] mb-4">Publication Integrity and Timeline</h2>
      <div className="space-y-4">
        <p className="text-[#212121]">
          We aim to complete the peer review cycle within 4–6 weeks, depending on reviewer availability and the complexity of the manuscript. All accepted content is subjected to plagiarism checks, copyediting, and final formatting.
        </p>
        <p className="text-[#212121] mt-4 font-semibold">
          Note: Synergy World Press follows a no Article Processing Charges (APC) policy for its journals and does not charge any fees for chapter inclusion in edited volumes, ensuring academic accessibility and inclusion.
        </p>
      </div>
    </section>
  </Layout>
);

export default PublicationIntegrityAndTimeline;
