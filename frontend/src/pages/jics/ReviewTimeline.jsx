import React from 'react';

const ReviewTimeline = () => (
  <section className=" max-w-3xl mx-auto my-8  p-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Review Timeline
    </h2>
    
    <div className="space-y-8">
      <div className="bg-[#e0f7fa] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00acc1] mb-3">
          Initial Screening
        </h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          Within 7–10 days of submission to check scope, formatting, and ethical compliance.
        </p>
      </div>

      <div className="bg-[#e8f5e9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#2e7d32] mb-3">
          Peer Review
        </h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          Typically completed within 4–6 weeks, depending on reviewer availability and complexity of the manuscript.
        </p>
      </div>

      <div className="bg-[#ede7f6] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#6a1b9a] mb-3">
          Revision & Final Decision
        </h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          Authors are given 2–3 weeks to address reviewer comments. The final decision is usually communicated within 60 days of the initial submission.
        </p>
      </div>

      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">
          Total Timeline
        </h3>
        <div className="space-y-3">
          <p className="text-[#212121] leading-relaxed text-justify">
            <span className="font-medium">Best Case:</span> 45-60 days from submission to final decision
          </p>
          <p className="text-[#212121] leading-relaxed text-justify">
            <span className="font-medium">Average Case:</span> 60-90 days from submission to final decision
          </p>
          <p className="text-[#212121] leading-relaxed text-justify">
            <span className="font-medium">Note:</span> Timeline may vary based on manuscript complexity and reviewer availability
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default ReviewTimeline;
