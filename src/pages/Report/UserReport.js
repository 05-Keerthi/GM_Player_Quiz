import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/NavbarComp';
import { 
  Container, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress, 
  Typography 
} from '@mui/material';
import { useReportContext } from '../../context/ReportContext'; // Import your context

const UserReport = () => {
  const { quizId, userId } = useParams(); // Get quizId and userId from URL params
  const { getUserReportByQuiz, currentReport, loading, error } = useReportContext(); // Get context values

  // Fetch the report on component mount
  useEffect(() => {
    if (quizId && userId) {
      getUserReportByQuiz(quizId, userId);
    }
  }, [quizId, userId, getUserReportByQuiz]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <CircularProgress />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen text-red-500">
          <div className="text-center">
            <Typography variant="h6" color="error" gutterBottom>{error}</Typography>
            <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!currentReport) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <Typography variant="h6">No report found</Typography>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Container maxWidth="md" className="mt-8">
        <Paper className="p-8">
          <Typography variant="h4" className="text-center mb-4">
            User Quiz Report
          </Typography>
          <TableContainer component={Paper} className="mt-4">
            <Table aria-label="User Report Table">
              <TableHead>
                <TableRow>
                  <TableCell>Quiz Title</TableCell>
                  <TableCell>Total Questions</TableCell>
                  <TableCell>Correct Answers</TableCell>
                  <TableCell>Total Score</TableCell>
                  <TableCell>Completed At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{currentReport.quiz?.title || 'N/A'}</TableCell>
                  <TableCell>{currentReport.totalQuestions}</TableCell>
                  <TableCell>
                    <span className="text-green-500">{currentReport.correctAnswers}</span> / 
                    <span className="text-red-500">{currentReport.incorrectAnswers}</span>
                  </TableCell>
                  <TableCell>{currentReport.totalScore}</TableCell>
                  <TableCell>{new Date(currentReport.completedAt).toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </div>
  );
};

export default UserReport;
