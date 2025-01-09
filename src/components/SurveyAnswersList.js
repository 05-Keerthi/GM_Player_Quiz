import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSurveyAnswerContext } from '../context/surveyAnswerContext';
import { Loader2 } from 'lucide-react';

const SurveyAnswersList = () => {
  const { sessionId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [answers, setAnswers] = useState([]);
  const { getSessionAnswers, getQuestionAnswers, loading } = useSurveyAnswerContext();

  useEffect(() => {
    fetchSessionAnswers();
  }, [sessionId]);

  const fetchSessionAnswers = async () => {
    try {
      const data = await getSessionAnswers(sessionId);
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Error fetching session answers:', error);
    }
  };

  const handleQuestionClick = async (question) => {
    setSelectedQuestion(question);
    try {
      const data = await getQuestionAnswers(sessionId, question._id);
      setAnswers(data.answers || []);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching question answers:', error);
    }
  };

  const renderAnswers = () => {
    if (!selectedQuestion) return null;

    switch (selectedQuestion.type) {
      case 'open_ended':
        return answers.map((answer, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg mb-2">
            {answer.answer}
          </div>
        ));
      
      case 'poll':
      case 'single_select':
      case 'multiple_select':
        const answerCounts = {};
        answers.forEach(answer => {
          const answerValue = Array.isArray(answer.answer) ? answer.answer : [answer.answer];
          answerValue.forEach(value => {
            answerCounts[value] = (answerCounts[value] || 0) + 1;
          });
        });

        return selectedQuestion.answerOptions.map(option => {
          const count = answerCounts[option.optionText] || 0;
          const percentage = answers.length ? Math.round((count / answers.length) * 100) : 0;
          
          return (
            <div key={option._id} className="mb-4">
              <div className="flex justify-between mb-1">
                <span>{option.optionText}</span>
                <span>{count} ({percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        });

      default:
        return <p>No answers available</p>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
       // In the loading state render:
       <Loader2 className="w-8 h-8 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Survey Questions</h1>
      <div className="grid gap-4">
        {questions.map((question, index) => (
          <button
            key={question._id}
            onClick={() => handleQuestionClick(question)}
            className="text-left p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <span className="font-medium">Question {index + 1}:</span> {question.title}
          </button>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">{selectedQuestion?.title}</h2>
            <div className="mb-6">
              {renderAnswers()}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyAnswersList;