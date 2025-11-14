import React from "react";
import { Link } from "react-router-dom";

function Editor() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-md border border-[#e2e8f0]">
        <h2 className="text-3xl font-bold text-center text-[#496580] mb-8">
          Editor Portal
        </h2>

        <div className="space-y-4">
          <Link to="/editor/register">
            <button className="w-full bg-[#496580] hover:bg-[#3a5269] text-white font-semibold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105">
              Apply for Editor
            </button>
          </Link>

          <Link to="/login">
            <button className="w-full bg-[#496580] hover:bg-[#3a5269] text-white font-semibold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105">
              Sign in as Editor
            </button>
          </Link>
        </div>

        <div className="mt-6 text-center text-[#496580] text-sm">
          Join our editorial team and contribute to academic excellence
        </div>
      </div>
    </div>
  );
}

export default Editor;