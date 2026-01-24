import Quiz from "../models/Quiz.js";

export const getQuizzes = async (req, res) => {
  const quizzes = await Quiz.find({
    userId: req.user._id,
    documentId: req.params.documentId,
  })
    .populate("documentId", "title fileName")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: quizzes.length,
    data: quizzes,
  });
};

// @desc Get all quizzes for a user
// @route GET /api/quizzes
// @access Private
export const getAllQuizzes = async (req, res) => {
  const quizzes = await Quiz.find({ userId: req.user._id })
    .populate("documentId", "title")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: quizzes.length,
    data: quizzes,
  });
};

export const getQuizById = async (req, res) => {
  const quiz = await Quiz.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!quiz) {
    return res.status(404).json({
      success: false,
      error: "Quiz was not found",
      status: 404,
    });
  }

  res.status(200).json({
    success: true,
    data: quiz,
  });
};

export const submitQuiz = async (req, res) => {
  const { answers } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({
      success: false,
      error: "Please provide answers array",
      status: 400,
    });
  }

  const quiz = await Quiz.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!quiz) {
    return res.status(404).json({
      success: false,
      error: "Quiz was not found",
      status: 404,
    });
  }

  if (quiz.completedAt) {
    return res.status(400).json({
      success: false,
      error: "You cannot take the same quiz twice",
      status: 400,
    });
  }

  let correctCount = 0;
  const userAnswers = [];

  answers.forEach((answer) => {
    const { questionIndex, selectedAnswer } = answer;

    if (questionIndex < quiz.questions.length) {
      const question = quiz.questions[questionIndex];
      const isCorrect = selectedAnswer === question.correctAnswer;

      if (isCorrect) correctCount++;

      userAnswers.push({
        questionIndex,
        selectedAnswer,
        isCorrect,
        answeredAt: new Date(),
      });
    }
  });

  const score = Math.round((correctCount / quiz.questions.length) * 100);

  // Update quiz
  quiz.userAnswers = userAnswers;
  quiz.score = score;
  quiz.completedAt = new Date();

  await quiz.save();

  res.status(200).json({
    success: true,
    data: {
      quizId: quiz._id,
      score,
      correctCount,
      totalQuestions: quiz.questions.length,
      percentage: score,
      userAnswers,
    },
    message: "Quiz submitted successfully",
  });
};

export const getQuizResults = async (req, res) => {
  const quiz = await Quiz.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).populate("documentId", "title")

  if (!quiz) {
    return res.status(404).json({
      success: false,
      error: "Quiz was not found",
      status: 404,
    });
  }

  if (!quiz.completedAt) {
    return res.status(400).json({
      success: false,
      error: "Quiz not completed yet",
      status: 400,
    });
  }

  const detailedResults = quiz.questions.map((q, index) => {
    const userAnswer = quiz.userAnswers.find((a) => a.questionIndex === index)

    return {
      questionIndex: index,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      selectedAnswer: userAnswer?.selectedAnswer || null,
      isCorrect: userAnswer?.isCorrect || false,
      explanation: q.explanation
    }
  })

  res.status(200).json({
    success: true,
    data: {
      quiz: {
        id: quiz._id,
        title: quiz.title,
        document: quiz.documentId,
        score: quiz.score,
        completedAt: quiz.completedAt,
        totalQuestions: quiz.questions.length,
      },
      results: detailedResults
    },
  });
};

export const deleteQuiz = async (req, res) => {
  const quiz = await Quiz.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!quiz) {
    return res.status(404).json({
      success: false,
      error: "Quiz was not found",
      status: 404,
    });
  }

  await quiz.deleteOne()

  res.status(200).json({
    success: true,
    message: "Your quiz was successfully deleted",
  });
};
