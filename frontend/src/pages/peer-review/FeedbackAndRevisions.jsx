import React from 'react';
import Layout from '../../components/Layout';

const FeedbackAndRevisions = () => (
  <Layout>
    <section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8 border border-[#e0e0e0]">
      <h2 className="text-2xl font-bold text-[#00796b] mb-4">Feedback and Revisions</h2>
      <div className="space-y-4">
        <p className="text-[#212121]">
          Authors receive detailed reviewer comments and are invited to submit revised versions of their manuscripts. For edited books, chapter authors work closely with volume editors and reviewers to ensure the coherence and academic rigor of the full volume.
        </p>
      </div>
    </section>
  </Layout>
);

export default FeedbackAndRevisions;
