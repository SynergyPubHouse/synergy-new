import React from 'react';
import Layout from '../../components/Layout';

const InitialEditorialScreening = () => (
  <Layout>
    <section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8 border border-[#e0e0e0]">
      <h2 className="text-2xl font-bold text-[#00796b] mb-4">Initial Editorial Screening</h2>
      <div className="space-y-4">
        <p className="text-[#212121]">
          All submitted manuscripts—whether journal articles or book chapters—undergo an initial screening by the editorial team to ensure:
        </p>
        <ul className="list-disc ml-6 text-[#212121] space-y-2">
          <li>Relevance to the scope of the publication</li>
          <li>Originality of the content</li>
          <li>Compliance with formatting and ethical guidelines</li>
        </ul>
        <p className="text-[#212121] mt-4">
          Submissions that do not meet these basic criteria may be desk-rejected.
        </p>
      </div>
    </section>
  </Layout>
);

export default InitialEditorialScreening;
