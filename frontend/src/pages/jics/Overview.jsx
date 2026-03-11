import React from 'react';
import { Link } from 'react-router-dom';

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

      {/* Publication Details Table */}
      <div className="mt-10 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <div className="bg-[#00796b] px-6 py-3">
          <h3 className="text-white font-bold text-lg">About the Publication</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-sm font-bold text-[#00796b] w-1/3 border-b border-gray-200">Item</th>
              <th className="px-6 py-4 text-sm font-bold text-[#00796b] border-b border-gray-200">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Journal Title</td>
              <td className="px-6 py-4 text-sm text-gray-700">Journal of Intelligent Computing System</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Abbreviation</td>
              <td className="px-6 py-4 text-sm text-gray-700">JICS</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Starting Year</td>
              <td className="px-6 py-4 text-sm text-gray-700">2025</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Frequency</td>
              <td className="px-6 py-4 text-sm text-gray-700">Three issues per year</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Publication Months</td>
              <td className="px-6 py-4 text-sm text-gray-700">January, May, September</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Format</td>
              <td className="px-6 py-4 text-sm text-gray-700">Online</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Language</td>
              <td className="px-6 py-4 text-sm text-gray-700">English</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Subject Area</td>
              <td className="px-6 py-4 text-sm text-gray-700">Intelligent Computing, Artificial Intelligence, Machine Learning, Data Science, Computational Intelligence, Internet of Things (IoT), Cloud Computing, Cybersecurity, Software Engineering, and Emerging Intelligent Technologies</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Peer Review Process</td>
              <td className="px-6 py-4 text-sm text-gray-700">Double Blind Peer Review</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Access Type</td>
              <td className="px-6 py-4 text-sm text-gray-700">Open Access</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Article Processing Charges (APC)</td>
              <td className="px-6 py-4 text-sm text-gray-700">Currently, there are no submission or publication charges for authors</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Publisher</td>
              <td className="px-6 py-4 text-sm text-gray-700">Synergy World Press</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Publisher Address</td>
              <td className="px-6 py-4 text-sm text-gray-700">S4, 904, Harmony Homes, Panipat, Haryana, 132103, INDIA</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Email</td>
              <td className="px-6 py-4 text-sm text-gray-700">synergyworldpress@gmail.com</td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm text-gray-700 bg-gray-50">Website</td>
              <td className="px-6 py-4 text-sm text-gray-700">https://synergyworldpress.com/journal/jics/about/overview</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Editorial Leadership - Single Card */}
      <div className="mt-10 border-l-4 border-[#00796b] bg-gradient-to-r from-gray-50 to-white p-6 rounded-r-xl shadow-sm hover:shadow-md transition-all duration-300">
        {/* Header with Title & Link */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-[#00796b] font-bold uppercase tracking-widest">
            ✦ Editorial Leadership
          </p>
          <Link
            to="/journal/jics/about/editorial-board"
            className="group flex items-center gap-2 text-[#00796b] hover:text-white bg-[#e0f2f1] hover:bg-[#00796b] px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
          >
            View Editorial Board
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Both Editors in Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Editor-in-Chief */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-[#00796b] hover:shadow-sm transition-all duration-300">
            <img
              src="/images/b12a986f-b157-4137-93fa-c6d5af52a98a.jfif"
              alt="Dr. Meenu Gupta"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#00796b] shadow-md hover:scale-105 transition-transform duration-300 flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[10px] text-[#00796b] font-bold uppercase tracking-wider mb-1">
                Editor-in-Chief
              </p>
              <h4 className="text-base font-bold text-[#212121] hover:text-[#00796b] transition-colors leading-tight">
                Dr. Meenu Gupta
              </h4>
              <p className="text-gray-500 text-xs mt-1 flex items-start gap-1">
                <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-2">Chandigarh University, Mohali, Punjab, India</span>
              </p>
            </div>
          </div>

          {/* Co-Editor-in-Chief */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-[#26a69a] hover:shadow-sm transition-all duration-300">
            <img
              src="/images/coEditorInChief.jfif"
              alt="Dr. Rakesh Kumar"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#26a69a] shadow-md hover:scale-105 transition-transform duration-300 flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[10px] text-[#26a69a] font-bold uppercase tracking-wider mb-1">
                Co-Editor-in-Chief
              </p>
              <h4 className="text-base font-bold text-[#212121] hover:text-[#26a69a] transition-colors leading-tight">
                Dr. Rakesh Kumar
              </h4>
              <p className="text-gray-500 text-xs mt-1 flex items-start gap-1">
                <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-2">Chandigarh University, Mohali, Punjab, India</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Overview;