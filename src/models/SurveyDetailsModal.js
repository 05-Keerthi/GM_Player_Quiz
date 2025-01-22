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

const SurveyDetailsModal = ({ open, onClose, survey }) => {
  if (!survey) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded shadow-lg w-11/12 md:w-2/3 lg:w-1/2">
        <Typography variant="h5" className="mb-6 text-center">
          Survey Details
        </Typography>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row">
                <span className="text-xl font-bold">Survey Title</span>
              </TableCell>
              <TableCell>
                <span className="text-xl font-medium">{survey.surveyQuiz?.title}</span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">
                Completion Date
              </TableCell>
              <TableCell>
                {new Date(survey.completedAt).toLocaleString()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">
                Total Questions
              </TableCell>
              <TableCell>{survey.surveyTotalQuestions}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">
                Questions Attempted
              </TableCell>
              <TableCell>
                <span className="text-green-500">{survey.questionsAttempted}</span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">
                Questions Skipped
              </TableCell>
              <TableCell>
                <span className="text-yellow-500">{survey.questionsSkipped}</span>
              </TableCell>
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

export default SurveyDetailsModal;