import React, { useState } from "react";
import PageHeader from "../common/PageHeader";
import Button from "../common/Button";
import { ArrowLeft, Trash2 } from "lucide-react";
import Modal from "../common/Modal";
import toast from "react-hot-toast";
import { flashcardService } from "../../services";
import { Link } from "react-router-dom";

const FlashcardHeader = ({ cardSet, backToSets }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteSet = async () => {
    if (!cardSet) return toast.error("CardSet is undefined");
    setDeleting(true);
    
    try {
      const { message } = await flashcardService.deleteFlashcardSet(
        cardSet._id,
      );
      toast.success(message);
      setIsDeleteModalOpen(false)
      backToSets();
    } catch (err) {
      toast.error(err.error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Back Button */}
      <div className="mb-4">
        <Link
          to={`/flashcards`}
          className="inline-flex text-sm items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" size={16} />
          Back to Your Sets
        </Link>
      </div>

      <PageHeader title="Flashcards">
        <Button
          onClick={() => setIsDeleteModalOpen(true)}
          disabled={deleting}
          className="-mt-1.5"
        >
          <Trash2 size={16} />
          Delete Set
        </Button>
      </PageHeader>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        closeModal={() => setIsDeleteModalOpen(false)}
        title="Delete Flashcard Set?"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this flashcard set? <br />
            This action cannot be undone and all cards will be{" "}
            <b>permanently</b> removed.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleting}
              className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSet}
              disabled={deleting}
              className="px-5 h-11 bg-linear-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/25 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Yes, do it"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FlashcardHeader;
