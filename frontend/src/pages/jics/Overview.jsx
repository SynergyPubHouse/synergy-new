import React from 'react';

const Overview = () => (
  <section className="max-w-3xl mx-auto my-8 p-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Journal Overview
    </h2>
    <div className="space-y-6">
      <p className="text-[#212121] text-lg leading-relaxed text-justify">
        The Journal of Intelligent Computing System (JICS) is a peer-reviewed, open-access international journal dedicated to the advancement of intelligent computing research and its real-world applications. Published by Synergy World Press, JICS serves as a scholarly platform for researchers, practitioners, and industry professionals to share innovative ideas, theoretical foundations, and practical developments in intelligent computing systems.
      </p>
      <p className="text-[#212121] text-lg leading-relaxed text-justify">
        Our mission is to foster interdisciplinary dialogue and disseminate cutting-edge research that integrates artificial intelligence, machine learning, data science, and smart system design across diverse application domains. The journal emphasizes originality, relevance, and scientific rigor, and is committed to contributing to the global body of knowledge in intelligent technologies.
      </p>
      <p className="text-[#212121] text-lg leading-relaxed text-justify">
        There are no publication or article processing charges (APCs). We are committed to supporting open-access publishing while ensuring that authors face no financial barriers in disseminating their work.
      </p>

      {/* Editor-in-Chief Line */}
      <p className="text-left text-[#424242] font-medium pt-4 text-lg">
        <span className="italic font-bold text-xl">Editor-in-Chief</span>
        <br />
        Dr. Meenu Gupta
      </p>


    </div>
  </section>
);

export default Overview;
