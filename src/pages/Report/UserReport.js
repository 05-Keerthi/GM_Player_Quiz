import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/NavbarComp";
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
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useReportContext } from "../../context/ReportContext";

const UserReport = () => {
  const { quizId, userId } = useParams();
  const navigate = useNavigate();
  const { getUserReportByQuiz, currentReport, loading, error } =
    useReportContext();

  useEffect(() => {
    if (quizId && userId) {
      getUserReportByQuiz(quizId, userId);
    }
  }, [quizId, userId]);

  const handleBack = () => {
    navigate(`/userreports/${userId}`);
  };

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
            <Typography variant="h6" color="error" gutterBottom>
              {error}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
            >
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
          className="mb-4"
        >
          Back to Quiz List
        </Button>
        <Paper className="p-8">
          <Typography variant="h4" className="text-center mb-4">
            Detailed Quiz Report
          </Typography>
          <Typography variant="h6" className="mb-4 text-center">
            {currentReport.quiz?.title || "N/A"}
          </Typography>
          <TableContainer component={Paper} className="mt-4">
            <Table aria-label="Report Details Table">
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Total Questions</TableCell>
                  <TableCell>{currentReport.totalQuestions}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Correct Answers</TableCell>
                  <TableCell className="text-green-500">
                    {currentReport.correctAnswers}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Incorrect Answers</TableCell>
                  <TableCell className="text-red-500">
                    {currentReport.incorrectAnswers}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Score</TableCell>
                  <TableCell>{currentReport.totalScore}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Completion Date</TableCell>
                  <TableCell>
                    {new Date(currentReport.completedAt).toLocaleString()}
                  </TableCell>
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