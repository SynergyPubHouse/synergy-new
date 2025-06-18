import React from 'react';
import { Link } from 'react-router-dom';

const AimsAndScope = () => (
  <section className=" max-w-3xl mx-auto my-8  p-8">
    <h2 className="text-3xl font-extrabold text-[#00796b] mb-6 tracking-tight">
      Aims and Scope
    </h2>
    
    <p className="text-[#212121] mb-8 text-lg leading-relaxed text-justify">
      The Journal of Intelligent Computing System welcomes original research articles, review papers, short communications, and case studies in (but not limited to) the following areas:
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
        <li>Artificial Intelligence and Machine Learning</li>
        <li>Intelligent Data Analytics and Big Data</li>
        <li>Soft Computing and Computational Intelligence</li>
        <li>Deep Learning and Neural Networks</li>
        <li>Natural Language Processing</li>
        <li>Cognitive Computing</li>
        <li>Fuzzy Logic, Evolutionary Algorithms, and Hybrid Systems</li>
        <li>Knowledge-Based and Expert Systems</li>
      </ul>
      <ul className="list-disc ml-6 text-[#212121] space-y-3 text-lg leading-relaxed">
        <li>Edge, Cloud, and Fog Computing for Intelligent Systems</li>
        <li>IoT and Intelligent Sensor Networks</li>
        <li>Robotics and Autonomous Systems</li>
        <li>Human–Computer Interaction and Intelligent Interfaces</li>
        <li>Intelligent Control Systems and Decision Support</li>
        <li>Smart Cities, Smart Healthcare, and Industry 4.0 Applications</li>
        <li>Security and Privacy in Intelligent Computing</li>
      </ul>
    </div>

    <p className="text-[#212121] text-lg leading-relaxed">
      JICS aims to be a valuable resource for academics, researchers, and professionals who seek to explore and contribute to the next generation of intelligent systems.{' '}
      <Link 
        to="/journal/jics/submit" 
        className="text-[#00acc1] hover:text-[#00796b] font-medium underline transition-colors"
      >
        Click here to submit research paper
      </Link>
    </p>
  </section>
);

export default AimsAndScope;
