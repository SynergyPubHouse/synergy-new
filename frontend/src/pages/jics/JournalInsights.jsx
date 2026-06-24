import React from "react";
import { Link } from "react-router-dom";

const Section = ({ title, children }) => (
  <div className="flex flex-col md:flex-row gap-6 py-8 border-b border-gray-100 last:border-0">
    <div className="w-full md:w-48 flex-shrink-0">
      <h3 className="text-sm font-semibold text-[#212121]">{title}</h3>
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const timeline = [
  { value: "10 days", label: "Submission to first decision" },
  { value: "45 days", label: "Submission to decision after review" },
  { value: "60 days", label: "Submission to acceptance" },
  { value: "12 days", label: "Acceptance to online publication" },
];

const indexing = ["Google Scholar", "CrossRef"];

const subjectAreas = [
  "Intelligent Computing",
  "Artificial Intelligence",
  "Machine Learning & Deep Learning",
  "Data Science & Big Data Analytics",
  "Internet of Things (IoT)",
  "Cloud & Edge Computing",
  "Cybersecurity",
  "Software Engineering",
  "Natural Language Processing",
  "Computer Vision",
];

const JournalInsights = () => (
  <section className="max-w-4xl mx-auto">
    {/* Page title */}
    <div className="mb-8">
      <h2 className="text-2xl font-extrabold text-[#212121] tracking-tight">
        Journal Insights
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        Journal of Intelligent Computing System (JICS)
      </p>
    </div>

    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 md:px-10 divide-y divide-gray-100">
      {/* Aims & scope */}
      <Section title="Aims & scope">
        <p className="text-sm text-gray-700 leading-relaxed">
          The Journal of Intelligent Computing System (JICS) is a peer-reviewed,
          open-access international journal dedicated to the advancement of
          intelligent computing research and its real-world applications.
          Published by Synergy World Press, JICS serves as a scholarly platform
          for researchers, practitioners, and industry professionals to share
          innovative ideas, theoretical foundations, and practical developments
          in intelligent computing systems.
        </p>
        <Link
          to="/journal/jics/about/aims-scope"
          className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-[#00796b] hover:underline"
        >
          View full aims &amp; scope
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </Section>

      {/* ISSN */}
      <Section title="ISSN">
        <p className="text-sm text-gray-700">
          Online ISSN:&nbsp;
          <span className="font-semibold text-[#212121]">3139-3616</span>
        </p>
      </Section>

      {/* Subject areas */}
      <Section title="Subject areas">
        <ul className="flex flex-wrap gap-2">
          {subjectAreas.map((s) => (
            <li
              key={s}
              className="text-xs bg-[#e0f2f1] text-[#00796b] font-medium px-3 py-1 rounded-full"
            >
              {s}
            </li>
          ))}
        </ul>
      </Section>

      {/* Article publishing options */}
      <Section title="Article publishing options">
        <div className="space-y-5">
          {/* Open Access */}
          <div className="border-l-4 border-[#00796b] pl-4">
            <p className="text-sm font-bold text-[#212121] mb-1">Open Access</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              All articles published in JICS are immediately and permanently
              free to read, download, and share. There are{" "}
              <span className="font-semibold text-[#212121]">
                no Article Processing Charges (APCs)
              </span>{" "}
              — authors face no financial barriers to publishing.
            </p>
            <Link
              to="/journal/jics/policies"
              className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-[#00796b] hover:underline"
            >
              View journal policies
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
          {/* License */}
          <div className="border-l-4 border-[#00acc1] pl-4">
            <p className="text-sm font-bold text-[#212121] mb-1">License</p>
            <p className="text-sm text-gray-600">
              Published under a{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#00796b] hover:underline"
              >
                Creative Commons Attribution 4.0 (CC BY 4.0)
              </a>{" "}
              licence, allowing unrestricted use, distribution, and reproduction
              in any medium, provided the original work is properly cited.
            </p>
          </div>
        </div>
      </Section>

      {/* Publishing timeline */}
      <Section title="Publishing timeline">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {timeline.map(({ value, label }) => (
            <div key={label} className="flex gap-3 items-start">
              <div className="w-1 self-stretch rounded-full bg-[#00796b] flex-shrink-0" />
              <div>
                <p className="text-xl font-extrabold text-[#00796b] leading-none">
                  {value}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-snug">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Link
          to="/journal/jics/review/timeline"
          className="inline-flex items-center gap-1 mt-5 text-sm font-semibold text-[#00796b] hover:underline"
        >
          View review timeline
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </Section>

      {/* Abstracting & indexing */}
      <Section title="Abstracting and indexing">
        <ul className="space-y-2">
          {indexing.map((name) => (
            <li
              key={name}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <svg
                className="w-4 h-4 text-[#00796b] flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {name}
            </li>
          ))}
        </ul>
        <Link
          to="/journal/jics/indexing"
          className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-[#00796b] hover:underline"
        >
          View full indexing details
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </Section>

      {/* Editor-in-Chief callout */}
      <Section title="Editor-in-Chief">
        <div className="flex items-center gap-4">
          <img
            src="/images/b12a986f-b157-4137-93fa-c6d5af52a98a.jfif"
            alt="Dr. Meenu Gupta"
            className="w-14 h-14 rounded-full object-cover border-2 border-[#00796b] shadow flex-shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-[#212121]">Dr. Meenu Gupta</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Chandigarh University, Mohali, Punjab, India
            </p>
          </div>
        </div>
        <Link
          to="/journal/jics/about/editorial-board"
          className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-[#00796b] hover:underline"
        >
          View full editorial board
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </Section>
    </div>
  </section>
);

export default JournalInsights;
