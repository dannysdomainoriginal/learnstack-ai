import React from "react";
import { Plus, Trash2, Brain, Sparkles } from "lucide-react";
import moment from "moment";
import Spinner from "../common/Spinner";

/**
 * Props:
 * - loading: boolean
 * - flashcardSets: array
 * - generating: boolean
 * - handleGenerateFlashcards: () => void
 * - handleSelectSet: (set) => void
 * - handleDeleteRequest: (event, set) => void
 */
const FlashcardSetsList = ({
  loading,
  flashcardSets,
  generating,
  handleGenerateFlashcards,
  handleSelectSet,
  handleDeleteRequest,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (flashcardSets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-100 to-teal-100 mb-6">
          <Brain className="w-8 h-8 text-emerald-600" strokeWidth={2} />
        </div>

        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No Flashcards Yet
        </h3>

        <p className="text-sm text-slate-500 mb-8 text-center max-w-sm">
          Generate flashcards from your documents to start learning and
          reinforce your knowledge
        </p>

        <button
          onClick={handleGenerateFlashcards}
          disabled={generating}
          className="group inline-flex items-center gap-2 px-6 h-12 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" strokeWidth={2} />
              Generate Flashcards
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Your Flashcard Sets
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {flashcardSets.length} {flashcardSets.length === 1 ? "set" : "sets"}{" "}
            available
          </p>
        </div>

        <button
          onClick={handleGenerateFlashcards}
          disabled={generating}
          className="group inline-flex items-center gap-2 px-5 h-11 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Generate New Set
            </>
          )}
        </button>
      </div>

      {/* Sets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcardSets.map((set) => (
          <div
            key={set._id}
            onClick={() => handleSelectSet(set)}
            className="group relative bg-white/80 backdrop-blur-xl border-2 border-slate-200 hover:border-emerald-300 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            {/* Delete Button */}
            <button
              onClick={(e) => handleDeleteRequest(e, set)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2} />
            </button>

            {/* Set Content */}
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-emerald-100 to-teal-100">
                <Brain className="w-6 h-6 text-emerald-600" strokeWidth={2} />
              </div>

              <div>
                <h4 className="text-base font-semibold text-slate-900 mb-1">
                  Flashcard Set
                </h4>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Created {moment(set.createdAt).format("MMM D, YYYY")}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-sm font-semibold text-emerald-700">
                    {set.cards.length}{" "}
                    {set.cards.length === 1 ? "card" : "cards"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlashcardSetsList;
