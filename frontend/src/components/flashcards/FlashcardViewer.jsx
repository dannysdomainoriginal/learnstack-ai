import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import Flashcard from "./Flashcard";

const FlashcardViewer = ({
  selectedSet,
  currentCardIndex,
  setSelectedSet,
  handleNextCard,
  handlePrevCard,
  handleToggleStar,
}) => {
  const currentCard = selectedSet.cards[currentCardIndex];

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 cursor-pointer transition-colors duration-200"
        onClick={() => setSelectedSet(null)}
      >
        <ArrowLeft
          className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
          strokeWidth={2}
        />
        Back to Sets
      </button>

      {/* Flashcard Display */}
      <div className="flex flex-col items-center space-y-8">
        <div className="w-full max-w-2xl">
          <Flashcard
            key={currentCard?._id}
            flashcard={currentCard}
            onToggleStar={handleToggleStar}
          />
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevCard}
            disabled={selectedSet.cards.length <= 1}
            className="group flex items-center gap-2 px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
          >
            <ChevronLeft
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200"
              strokeWidth={2.5}
            />
            Previous
          </button>

          <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-sm font-semibold text-slate-700">
              {currentCardIndex + 1}{" "}
              <span className="text-slate-400 font-normal">/</span>
              {selectedSet.cards.length}
            </span>
          </div>

          <button
            onClick={handleNextCard}
            disabled={selectedSet.cards.length <= 1}
            className="group flex items-center gap-2 px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
          >
            Next
            <ChevronRight className="" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardViewer;
