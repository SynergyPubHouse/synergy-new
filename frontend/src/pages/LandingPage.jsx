import React from "react";
import Header from "../components/Header";
import Navigation from "../components/Navigation";

const LandingPage = () => (
  <div className="min-h-screen bg-[#f9f9f9] font-sans">
    <Header />
    <Navigation />

    <section className="max-w-6xl mx-auto my-8 flex flex-col md:flex-row gap-8">
      {/* Left Side: About Us */}
      <div className="flex-1">
        <section className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-[#00796b] mb-4">About Us</h2>
          <div className="space-y-4 text-[#212121]">
            <p>
              Synergy World Press is a dynamic and forward-thinking publishing house committed
              to advancing knowledge across disciplines, with a strong emphasis on computer
              science, engineering, and interdisciplinary research. Our mission is to empower
              researchers, academics, and professionals by offering a global platform for
              high-quality scholarly publications, including books, conference proceedings,
              edited volumes, and academic journals. With a focus on innovation, academic integrity,
              and global collaboration, Synergy World Press supports both emerging and established
              scholars through comprehensive, end-to-end publishing solutions—from concept
              development to international dissemination.
            </p>
            <p>
              Whether you are an author, editor, or conference organizer,
              Synergy World Press is your trusted partner in scholarly publishing,
              ensuring global visibility, rigorous quality standards, and lasting academic impact.
            </p>
          </div>
        </section>
      </div>

      {/* Right Side: Two Sections */}
      <div className="flex-1 flex flex-col gap-8">
        {/* First Section */}
        <section className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-xl font-bold text-[#00796b] mb-4">Web Series</h2>
          <p className="text-[#212121]">
            comming soon...
          </p>
        </section>

        {/* Second Section */}
        {/* <section className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-xl font-bold text-[#00796b] mb-4">Web Series Cast</h2>
          <p className="text-[#212121]">
          comming soon...
          </p>
        </section> */}
      </div>
    </section>
  </div>
);

export default LandingPage;
