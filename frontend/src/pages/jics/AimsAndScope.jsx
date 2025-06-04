import React from 'react';
import { Link } from 'react-router-dom';

const AimsAndScope = () => (
  <section className="bg-white max-w-3xl mx-auto my-8 rounded-xl shadow-lg p-8">
    <h2 className="text-2xl font-bold text-indigo-900 mb-6">Aims and Scope</h2>
    
    <p className="text-gray-700 mb-6">
      The Journal of Intelligent Computing System welcomes original research articles, review papers, short communications, and case studies in (but not limited to) the following areas:
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <ul className="list-disc ml-6 text-gray-700 space-y-2">
        <li>Artificial Intelligence and Machine Learning</li>
        <li>Intelligent Data Analytics and Big Data</li>
        <li>Soft Computing and Computational Intelligence</li>
        <li>Deep Learning and Neural Networks</li>
        <li>Natural Language Processing</li>
        <li>Cognitive Computing</li>
        <li>Fuzzy Logic, Evolutionary Algorithms, and Hybrid Systems</li>
        <li>Knowledge-Based and Expert Systems</li>
      </ul>
      <ul className="list-disc ml-6 text-gray-700 space-y-2">
        <li>Edge, Cloud, and Fog Computing for Intelligent Systems</li>
        <li>IoT and Intelligent Sensor Networks</li>
        <li>Robotics and Autonomous Systems</li>
        <li>Human–Computer Interaction and Intelligent Interfaces</li>
        <li>Intelligent Control Systems and Decision Support</li>
        <li>Smart Cities, Smart Healthcare, and Industry 4.0 Applications</li>
        <li>Security and Privacy in Intelligent Computing</li>
      </ul>
    </div>

    <p className="text-gray-700">
      JICS aims to be a valuable resource for academics, researchers, and professionals who seek to explore and contribute to the next generation of intelligent systems.{' '}
      <Link 
        to="/journal/Journal-of-Intelligent-Computing-Systems/submit" 
        className="text-indigo-600 hover:text-indigo-800 underline"
      >
        Click here to submit research paper
      </Link>
    </p>
  </section>
);

export default AimsAndScope; 