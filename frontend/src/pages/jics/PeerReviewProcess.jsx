import React from 'react';

const PeerReviewProcess = () => (
  <section className=" max-w-3xl mx-auto my-8  p-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Peer Review Process
    </h2>
    
    <div className="space-y-8">
      <div className="bg-[#e0f7fa] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00acc1] mb-4">
          Double-Blind Peer Review
        </h3>
        <p className="text-[#212121] leading-relaxed text-justify">
          Journal of Intelligent Computing System(JICS) follows a double-blind peer review process, ensuring the anonymity of both authors and reviewers to maintain objectivity and fairness. Each manuscript is reviewed by at least two independent reviewers who are experts in the field relevant to the submission.
        </p>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-[#00796b]">
          Key Features of Our Review Process:
        </h3>
        <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
          <li>
            <p className="text-justify">
              Double-blind review ensures unbiased evaluation
            </p>
          </li>
          <li>
            <p className="text-justify">
              Minimum of two expert reviewers per manuscript
            </p>
          </li>
          <li>
            <p className="text-justify">
              Reviewers selected based on expertise in the relevant field
            </p>
          </li>
          <li>
            <p className="text-justify">
              Comprehensive evaluation of research quality and methodology
            </p>
          </li>
          <li>
            <p className="text-justify">
              Constructive feedback for authors
            </p>
          </li>
        </ul>
      </div>

      <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e0e0e0]">
        <h3 className="text-xl font-semibold text-[#00796b] mb-4">
          Benefits of Double-Blind Review
        </h3>
        <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
          <li>
            <p className="text-justify">
              Eliminates potential bias based on author identity
            </p>
          </li>
          <li>
            <p className="text-justify">
              Ensures focus on research quality and content
            </p>
          </li>
          <li>
            <p className="text-justify">
              Promotes fair and objective evaluation
            </p>
          </li>
          <li>
            <p className="text-justify">
              Maintains high academic standards
            </p>
          </li>
        </ul>
      </div>
    </div>
  </section>
);

export default PeerReviewProcess;
