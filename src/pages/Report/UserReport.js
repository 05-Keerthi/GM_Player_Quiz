import React, { useState, useEffect } from "react";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const UserReport = () => {
  const [reports, setReports] = useState({ quizzes: [], surveys: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/reports", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setReports(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch reports");
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const fetchDetailedReport = async (id, type) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/reports/${type}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setModalData(data);
      setSelectedItem({ id, type });
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch detailed report:", err);
    }
    setModalLoading(false);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );
  if (!reports?.quizzes || !reports?.surveys) return null;

  const totalAttempts =
    reports.quizzes.reduce((sum, quiz) => sum + quiz.attempts, 0) +
    reports.surveys.reduce((sum, survey) => sum + survey.attempts, 0);

  const renderModalContent = () => {
    if (modalLoading) return <div>Loading...</div>;
    if (!selectedItem) return null;

    if (selectedItem.type === "quiz") {
      return (
        <div>
          <h2 className="text-2xl font-bold mb-4">Quiz Attempts</h2>
          {modalData.map((attempt) => (
            <div key={attempt._id} className="mb-6 p-4 border rounded">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">
                    Quiz Title: {attempt.sessionDetails.quiz.quizTitle}
                  </p>
                  <p>Host: {attempt.sessionDetails.host}</p>
                  <p>Status: {attempt.sessionDetails.status}</p>
                </div>
                <div>
                  <p>Correct Answers: {attempt.correctAnswers}</p>
                  <p>Incorrect Answers: {attempt.incorrectAnswers}</p>
                  <p>
                    Completion Time:{" "}
                    {new Date(attempt.completedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <p>
                  Session Duration:{" "}
                  {Math.round(
                    (new Date(attempt.sessionDetails.endTime) -
                      new Date(attempt.sessionDetails.startTime)) /
                      1000
                  )}{" "}
                  seconds
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Survey Responses</h2>
        {modalData.map((response) => (
          <div key={response._id} className="mb-6 p-4 border rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">
                  Survey Title: {response.surveyQuiz.quizTitle}
                </p>
                <p>Questions Attempted: {response.questionsAttempted}</p>
                <p>Questions Skipped: {response.questionsSkipped}</p>
              </div>
              <div>
                <p>Status: {response.surveySessionDetails.status}</p>
                <p>
                  Completion Time:{" "}
                  {new Date(response.completedAt).toLocaleString()}
                </p>
                <p>
                  Duration:{" "}
                  {Math.round(
                    (new Date(response.surveySessionDetails.endTime) -
                      new Date(response.surveySessionDetails.startTime)) /
                      1000
                  )}{" "}
                  seconds
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-sm text-gray-500">Total Quizzes</p>
              <h3 className="text-2xl font-bold">{reports.quizzes.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-sm text-gray-500">Total Surveys</p>
              <h3 className="text-2xl font-bold">{reports.surveys.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-sm text-gray-500">Total Attempts</p>
              <h3 className="text-2xl font-bold">{totalAttempts}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Quiz Reports</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Quiz Title</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-left p-4">Attempts</th>
                  <th className="text-left p-4">Last Attempt</th>
                </tr>
              </thead>
              <tbody>
                {reports.quizzes.map((quiz) => (
                  <tr
                    key={quiz.QuizId}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => fetchDetailedReport(quiz.QuizId, "quiz")}
                  >
                    <td className="p-4">{quiz.QuizDetails.quizTitle}</td>
                    <td className="p-4">{quiz.QuizDetails.quizDescription}</td>
                    <td className="p-4">{quiz.attempts}</td>
                    <td className="p-4">
                      {new Date(quiz.lastAttempt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Survey Reports</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Survey Title</th>
                  <th className="text-left p-4">Attempts</th>
                  <th className="text-left p-4">Last Attempt</th>
                </tr>
              </thead>
              <tbody>
                {reports.surveys.map((survey) => (
                  <tr
                    key={survey.SurveyId}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      fetchDetailedReport(survey.SurveyId, "survey")
                    }
                  >
                    <td className="p-4">{survey.SurveyDetails.surveyTitle}</td>
                    <td className="p-4">{survey.attempts}</td>
                    <td className="p-4">
                      {new Date(survey.lastAttempt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {renderModalContent()}
      </Modal>
    </div>
  );
};

export default UserReport;
