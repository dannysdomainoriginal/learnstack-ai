import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { quizService, aiService } from '../../services'
import toast from 'react-hot-toast'

import Spinner from '../common/Spinner'
import Button from '../common/Button'
import Modal from '../common/Modal'
import QuizCard from './QuizCard'

const QuizManager = ({ documentId }) => {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [numQuestions, setNumQuestions] = useState(5)
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const fetchQuizzes = async () => {
    setLoading(true)

    try {
      const { data } = await quizService.getQuizzesByDocument(documentId)
      setQuizzes(data)
    } catch (err) {
      toast.error(err.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (documentId) {
      fetchQuizzes()
    }
  }, [])

  const handleGenerateQuiz = async (e) => {
    e.preventDefault()
    if (!numQuestions) {
      return toast.error("Please enter the number of questions for your quiz")
    }

    setGenerating(true)

    try {
      const { data, message } = aiService.generateQuiz(documentId, { numQuestions })
      toast.success(message)

      setIsGenerateModalOpen(false)
      setQuizzes((prev) => [...prev, data])
    } catch (err) {
      toast.error(err.error);
    } finally {
      setGenerating(false);
    }
  }

  const handleDeleteRequest = (quiz) => {
    
  }

  return (
    <div>QuizManager</div>
  )
}

export default QuizManager