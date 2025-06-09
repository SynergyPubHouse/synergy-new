import React from 'react';
import Layout from '../../components/Layout';

const DoubleBlindPeerReview = () => (
  <Layout>
    <section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8 border border-[#e0e0e0]">
      <h2 className="text-2xl font-bold text-[#00796b] mb-4">Double-Blind Peer Review</h2>
      <div className="space-y-4">
        <p className="text-[#212121]">
          Eligible submissions are subjected to a double-blind peer review process, in which both the reviewers and authors remain anonymous to each other.
        </p>
        <p className="text-[#212121]">
          Each manuscript is reviewed by at least two independent experts in the relevant field, who evaluate it based on:
        </p>
        <ul className="list-disc ml-6 text-[#212121] space-y-2">
          <li>Novelty and significance of the research</li>
          <li>Technical soundness and methodology</li>
          <li>Clarity, coherence, and structure</li>
          <li>Scholarly and practical contribution</li>
          <li>Adherence to ethical research standards</li>
        </ul>
      </div>
    </section>
  </Layout>
);

export default DoubleBlindPeerReview;
