import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useReportContext } from "../../context/ReportContext";
import { paginateData, PaginationControls } from "../../utils/pagination";

const UserQuizList = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { getUserReports, reports, loading, error } = useReportContext();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (userId) {
      getUserReports(userId);
    }
  }, [userId]);

  const handleQuizClick = (quizId) => {
    navigate(`/reports/${quizId}/user/${userId}`);
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

  if (!reports || reports.length === 0) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <Typography variant="h6">No quizzes taken yet</Typography>
        </div>
      </>
    );
  }

  const { currentItems, totalPages } = paginateData(
    reports,
    currentPage,
    itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Container maxWidth="md" className="mt-8">
        <Paper className="p-8">
          <Typography variant="h4" className="text-center mb-4">
            Quiz History
          </Typography>
          <TableContainer component={Paper} className="mt-4">
            <Table aria-label="Quiz List Table">
              <TableHead>
                <TableRow>
                  <TableCell>Quiz Title</TableCell>
                  <TableCell>Completion Date</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentItems.map((report) => (
                  <TableRow key={report._id} hover className="cursor-pointer">
                    <TableCell>{report.quiz?.title || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(report.completedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{report.totalScore}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleQuizClick(report.quiz?._id)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </Paper>
      </Container>
    </div>
  );
};

export default UserQuizList;