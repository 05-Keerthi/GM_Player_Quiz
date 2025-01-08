import React from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";

const QuizDetailsModal = ({ open, onClose, quiz }) => {
  if (!quiz) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded shadow-lg w-11/12 md:w-2/3 lg:w-1/2">
        <Typography variant="h5" className="mb-6 text-center">
          Quiz Details
        </Typography>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row">
              <span className="text-xl font-bold">Quiz Title</span>
              </TableCell>
              <TableCell><span className="text-xl font-medium">{quiz.quiz?.title}</span></TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">
                Completion Date
              </TableCell>
              <TableCell>
                {new Date(quiz.completedAt).toLocaleString()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">
                Score
              </TableCell>
              <TableCell>{quiz.totalScore}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">
                Correct Answers
              </TableCell>
              <TableCell>
                <span className="text-green-500">{quiz.correctAnswers}</span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">
                Incorrect Answers
              </TableCell>
              <TableCell>
                <span className="text-red-500">{quiz.incorrectAnswers}</span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">
                Total Questions
              </TableCell>
              <TableCell>{quiz.totalQuestions}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Box className="mt-8 text-right">
          <Button variant="contained" color="primary" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default QuizDetailsModal;
