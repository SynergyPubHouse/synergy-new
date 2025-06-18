import React from 'react';

const ReviewerEthics = () => (
  <section className=" max-w-3xl mx-auto my-8  p-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Reviewer Ethics
    </h2>
    
    <p className="text-[#212121] mb-8 text-lg leading-relaxed text-justify">
      Reviewers must adhere to the highest standards of academic ethics and confidentiality:
    </p>

    <div className="space-y-8">
      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">
          Confidentiality
        </h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          Maintain confidentiality of the manuscript and review content. All information and materials related to the review process must be kept strictly confidential.
        </p>
      </div>

      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">
          Objectivity
        </h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          Provide objective, constructive, and unbiased evaluations. Reviews should be based solely on the scientific merit of the work, without personal bias or prejudice.
        </p>
      </div>

      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">
          Conflict of Interest
        </h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          Avoid conflicts of interest. Reviewers must decline the review if a potential conflict exists. This includes personal, professional, or financial relationships that could influence the review.
        </p>
      </div>

      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-3">
          Ethical Use
        </h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          Refrain from using the manuscript content for personal advantage. Reviewers must not use any information, data, or ideas from the manuscript for their own research or other purposes.
        </p>
      </div>

      <div className="bg-[#e0f7fa] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00acc1] mb-3">
          Additional Responsibilities
        </h3>
        <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
          <li>
            <p className="text-justify">
              Provide timely and constructive feedback
            </p>
          </li>
          <li>
            <p className="text-justify">
              Identify potential ethical issues or concerns
            </p>
          </li>
          <li>
            <p className="text-justify">
              Maintain professional communication with editors
            </p>
          </li>
          <li>
            <p className="text-justify">
              Respect author confidentiality
            </p>
          </li>
        </ul>
      </div>
    </div>
  </section>
);

export default ReviewerEthics;
