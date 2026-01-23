import { useState, useEffect } from "react";
import { BrainCircuit } from "lucide-react";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import api from "../../utils/axiosInstance";

// TODOLIST
// 1) Add a number view
// 2) Make the icon different for flashcards, quizzes, concept, chat etc
// 3) Break down the naming convention, use it to format date & time, get icon, and normalize the name
// 4) Add username to files generated (if possible), for better admin UI experience
// 5) Create a separate admin route component + admin appLayout with admin tabs added to the menu
// 6) Find ways to track things like tokens used per generation

const GeneratedFilesPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data } = await api.get("/api/admin/generated");
        if (data.success) {
          setFiles(data.data);
        } else {
          toast.error("Failed to load generated files.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching generated files.");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6 sm:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-slate-900 tracking-tight mb-2">
            Generated Files
          </h1>
          <p className="text-slate-500 text-sm">
            Access all automatically generated items stored on the server.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-100 to-teal-100 mb-4">
              <BrainCircuit
                className="w-8 h-8 text-emerald-600"
                strokeWidth={2}
              />
            </div>
            <p className="text-slate-600 text-sm text-center">
              No generated files yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 [&&]:min-[1024px]:max-[1300px]:grid-cols-3 gap-6">
            {files.map((fileName) => (
              <a
                key={fileName}
                href={`/generated/${fileName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50 p-6 hover:shadow-2xl hover:shadow-emerald-300/20 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                {/* File Icon */}
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4">
                  <BrainCircuit
                    className="w-6 h-6 text-emerald-600"
                    strokeWidth={2}
                  />
                </div>

                {/* File Name */}
                <h4 className="text-base font-semibold text-slate-900 truncate">
                  {fileName}
                </h4>

                {/* Link / Subtitle */}
                <p className="text-xs text-slate-500 truncate mt-1">
                  Click to view/download
                </p>

                {/* Hover Overlay / Arrow */}
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  &#8594;
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratedFilesPage;
