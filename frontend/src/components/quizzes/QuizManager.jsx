import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { quizService, aiService } from "../../services";
import toast from "react-hot-toast";

import Spinner from "../common/Spinner";
import Button from "../common/Button";
import Modal from "../common/Modal";
import QuizCard from "./QuizCard";
import EmptyState from "../common/EmptyState";

const QuizManager = ({ documentId, documentTitle }) => {
  const baseTitle = documentTitle + " - Quiz";

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizTitle, setQuizTitle] = useState(baseTitle);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const fetchQuizzes = async () => {
    setLoading(true);

    try {
      const { data } = await quizService.getQuizzesByDocument(documentId);
      setQuizzes(data);
    } catch (err) {
      toast.error(err.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchQuizzes();
    }
  }, []);

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!numQuestions) {
      return toast.error("Please enter the number of questions for your quiz");
    }

    if (numQuestions > 30) {
      return toast.error("Maximum of 30 questions allowed");
    }

    if (!quizTitle.trim()) {
      return toast.error("Please specify a title for your quiz");
    }

    setGenerating(true);

    try {
      const { data, message } = await aiService.generateQuiz(documentId, {
        numQuestions,
        title: quizTitle,
      });
      toast.success(message);

      setIsGenerateModalOpen(false);
      setQuizzes((prev) => [data, ...prev]);
    } catch (err) {
      toast.error(err.error);
    } finally {
      setGenerating(false);
    }
  };

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

  const renderQuizContent = () => {
    if (loading) {
      return <Spinner />;
    }

    if (quizzes.length === 0) {
      return (
        <EmptyState
          title="No Quizzes Yet"
          description="Generate a quiz from your document to test your knowledge"
          buttonText="Generate Quiz"
          onActionClick={() => setIsGenerateModalOpen(true)}
        />
      );
    }

    return (
      <>
        <div className="flex justify-end gap-2 mb-7">
          <Button onClick={() => setIsGenerateModalOpen(true)}>
            <Plus size={16} />
            Generate Quiz
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 [&&]:min-[1024px]:max-[1300px]:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz._id}
              quiz={quiz}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      {/* Quiz Content */}
      {renderQuizContent()}

      {/* Generate Quiz Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        closeModal={() => setIsGenerateModalOpen(false)}
        title="Generate New Quiz"
      >
        <form onSubmit={handleGenerateQuiz} className="space-y-4">
          <div>
            <label className="block font-medium text-neutral-700 mb-1.5">
              Quiz Title
            </label>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              required
              className="w-full h-9 px-3 border border-neutral-200 rounded-lg bg-white text-sm text-neutral-900 placeholder-neutral-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#00d492] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block font-medium text-neutral-700 mb-1.5">
              Number of Question
            </label>
            <input
              type="number"
              value={numQuestions}
              onChange={(e) =>
                setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))
              }
              min={1}
              max={30}
              required
              className="w-full h-9 px-3 border border-neutral-200 rounded-lg bg-white text-sm text-neutral-900 placeholder-neutral-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#00d492] focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsGenerateModalOpen(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={generating}>
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        </form>
      </Modal>

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

export default QuizManager;
