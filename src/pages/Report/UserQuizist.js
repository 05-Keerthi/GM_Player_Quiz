import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/NavbarComp";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Collapse,
  IconButton,
  Box
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useReportContext } from "../../context/ReportContext";
import { paginateData, PaginationControls } from "../../utils/pagination";

// Row component to handle expandable attempts
const QuizRow = ({ quizData, userId }) => {
  const [open, setOpen] = useState(false);
  
  // Group attempts by quiz
  const attempts = quizData.attempts.sort((a, b) => 
    new Date(b.completedAt) - new Date(a.completedAt)
  );

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{quizData.quizTitle}</TableCell>
        <TableCell>{attempts.length}</TableCell>
        <TableCell>{Math.max(...attempts.map(a => a.totalScore))}</TableCell>
        <TableCell>{new Date(attempts[0].completedAt).toLocaleString()}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Attempts
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Attempt #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attempts.map((attempt, index) => (
                    <TableRow key={attempt._id}>
                      <TableCell>{attempts.length - index}</TableCell>
                      <TableCell>{new Date(attempt.completedAt).toLocaleString()}</TableCell>
                      <TableCell>{attempt.totalScore}</TableCell>
                      <TableCell>
          
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const UserQuizList = () => {

  const { userId } = useParams();
  const { getUserReports, reports, loading, error } = useReportContext();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (userId) {
      getUserReports(userId);
    }
  }, [userId]);


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
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
        </div>
      </>
    );
  }

  // Group reports by quiz
  const groupedReports = reports.reduce((acc, report) => {
    const quizId = report.quiz?._id;
    if (!acc[quizId]) {
      acc[quizId] = {
        quizId,
        quizTitle: report.quiz?.title || "N/A",
        attempts: []
      };
    }
    acc[quizId].attempts.push(report);
    return acc;
  }, {});

  const quizList = Object.values(groupedReports);
  const { currentItems, totalPages } = paginateData(quizList, currentPage, itemsPerPage);

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
                  <TableCell />
                  <TableCell>Quiz Title</TableCell>
                  <TableCell>Total Attempts</TableCell>
                  <TableCell>Best Score</TableCell>
                  <TableCell>Last Attempt Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentItems.map((quizData) => (
                  <QuizRow 
                    key={quizData.quizId}
                    quizData={quizData}
                    userId={userId}
            
                  />
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