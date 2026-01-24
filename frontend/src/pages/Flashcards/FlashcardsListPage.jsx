import { useState, useEffect } from 'react'
import { flashcardService } from '../../services'
import PageHeader from '../../components/common/PageHeader'
import Spinner from '../../components/common/Spinner'
import EmptyState from "../../components/common/EmptyState"
import toast from 'react-hot-toast'
import FlashcardSetCard from '../../components/flashcards/FlashcardSetCard'

const FlashcardsListPage = () => {
  const [flashcardSets, setFlashcardSets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFlashcardSets = async () => {
      try {
        const { data } = await flashcardService.getAllFlashcardSets()
        console.log("fetchFlashcardSets___", data)
        setFlashcardSets(data)
      } catch (err) {
        toast.error(err.error)
      } finally {
        setLoading(false)
      }
    }

    fetchFlashcardSets()
  }, [])

  const renderContent = () => {
    if (loading) {
      return <Spinner/>
    }

    if (flashcardSets.length === 0) {
      return (
        <EmptyState title="No Flashcard Set found" description="You haven't generated any flashcards yet. Go to a document to create your first set." />
      )
    }

    return (
      <div className="mt-8 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 [&&]:min-[1024px]:max-[1300px]:grid-cols-3 lg:grid-cols-4 gap-4">
          {flashcardSets.map((set, i) => (
            <FlashcardSetCard key={set._id} flashcardSet={set} index={i + 1} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Flashcard Sets" subtitle="An overview of your flashcard set across all documents" />
      {renderContent()}
    </div>
  )
}

export default FlashcardsListPage
