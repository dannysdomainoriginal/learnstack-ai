import { useState, useEffect } from "react";
import { ArrowRight, MessageCircleQuestionMark } from "lucide-react";
import { quizService } from "../../services";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import Spinner from "../../components/common/Spinner";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import QuizCard from "../../components/quizzes/QuizCard";
import PageHeader from "../../components/common/PageHeader";

const QuizListPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data } = await quizService.getAllQuizzes();
        setQuizzes(data);
      } catch (err) {
        toast.error(err.error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleDeleteRequest = (quiz) => {
    setSelectedQuiz(quiz);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuiz) return;
    setDeleting(true);

    try {
      const { message } = await quizService.deleteQuiz(selectedQuiz._id);

      toast.success(message);
      setIsDeleteModalOpen(false);
      setQuizzes((prev) => prev.filter((q) => q._id !== selectedQuiz._id));
      setSelectedQuiz(null);
    } catch (err) {
      toast.error(err.error);
    } finally {
      setDeleting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <Spinner />;
    }

    if (quizzes.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-emerald-200 to-teal-200 shadow-lg shadow-slate-200/50 mb-4">
              <MessageCircleQuestionMark
                className="w-10 h-10 text-emerald-600"
                strokeWidth={2}
              />
            </div>

            <h3 className="text-xl font-medium text-slate-900 tracking-tight mb-1">
              No Quizzes Yet
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Head over to your documents to generate a quiz
            </p>
            <Link to={`/documents`}>
              <button className="group/btn relative px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-95 overflow-hidden cursor-pointer">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Go to Documents
                  <ArrowRight
                    className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-700"
                    strokeWidth={2.5}
                  />
                </span>
                <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
              </button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-8 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 [&&]:min-[1024px]:max-[1300px]:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz._id}
              quiz={quiz}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="My Quizzes"
        subtitle="An overview of all quizzes generated across all documents"
      />

      {/* Quiz Content */}
      {renderContent()}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        closeModal={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Quiz"
      >
        <div className="space-y-8">
          <p className="text-sm text-neutral-600">
            Are you sure you want to delete the quiz:{" "}
            <span className="text-rose-500 font-semibold">
              {selectedQuiz?.title}
            </span>
            ?
            <br />
            This action <b>cannot</b> be undone
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleting}
              variant="danger"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuizListPage;
