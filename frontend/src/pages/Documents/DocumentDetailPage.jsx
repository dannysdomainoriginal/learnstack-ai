import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { documentService } from "../../services";
import Spinner from "../../components/common/Spinner";
import toast from "react-hot-toast";
import { ArrowLeft, ExternalLink } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import Tabs from "../../components/common/Tabs";
import ChatInterface from "../../components/chat/ChatInterface";
import AiActions from "../../components/ai/AiActions";
import FlashcardManager from "../../components/flashcards/FlashcardManager";
import QuizManager from "../../components/quizzes/QuizManager";

const DocumentDetailPage = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Content");

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        const { data } = await documentService.getDocumentById(id);
        setDocument(data);
      } catch (err) {
        toast.error(err.error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentDetails();
  }, []);

  useEffect(() => {
    const getTabFromHash = () => {
      const hash = window.location.hash
      const map = {
        "chat": "Chat",
        "quizzes": "Quizzes",
        "flashcards": "Flashcards",
        "ai-actions": "Ai Actions",
      }

      if (hash) {
        if (map[hash.slice(1)]) {
          setActiveTab(map[hash.slice(1)])
        }
      }
    }

    getTabFromHash()
  }, [])

  const renderContent = () => {
    if (loading) {
      return <Spinner />;
    }

    if (!document?.filePath) {
      return <div className="text-center p-8">PDF not available.</div>;
    }

    const pdfUrl = document.filePath;

    return (
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-300">
          <span className="text-sm font-medium text-gray-700">
            Document Viewer
          </span>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ExternalLink size={16} />
            Open in new tab
          </a>
        </div>

        <div className="bg-gray-100 p-1">
          <iframe
            src={pdfUrl}
            className="w-full h-[70vh] bg-white rounded border border-gray-300"
            title="PDF Viewer"
            frameBorder="0"
            style={{
              colorScheme: "light",
            }}
          >
            <p>
              Your browser does not support PDFs.
              <a href={pdfUrl}>Download PDF</a>
            </p>
          </iframe>
        </div>
      </div>
    );
  };

  const renderChat = () => {
    return <ChatInterface />;
  };

  const renderAiActions = () => {
    return <AiActions />;
  };

  const renderFlashcardsTab = () => {
    return <FlashcardManager documentId={id} />;
  };

  const renderQuizzesTab = () => {
    return <QuizManager documentId={id} documentTitle={document?.title} />;
  };

  const tabs = [
    { name: "Content", label: "Content", content: renderContent() },
    { name: "Chat", label: "Chat", content: renderChat() },
    { name: "AI Actions", label: "AI Actions", content: renderAiActions() },
    { name: "Flashcards", label: "Flashcards", content: renderFlashcardsTab() },
    { name: "Quizzes", label: "Quizzes", content: renderQuizzesTab() },
  ];

  if (loading) {
    return <Spinner />;
  }

  if (location.href.includes("document-is-missing")) {
    return (
      <div className="text-red-400">
        Your document has been deleted
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-red-400">
        There was a problem loading your document
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back To Documents
        </Link>
      </div>

      <PageHeader title={document.title} />
      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default DocumentDetailPage;
