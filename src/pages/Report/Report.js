// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import { useReportContext } from '../../context/ReportContext';
// import { useAuthContext } from '../../context/AuthContext'; // Fixed import
// import Navbar from '../../components/NavbarComp';
// import { 
//   Container, 
//   TextField, 
//   Button, 
//   Table, 
//   TableBody, 
//   TableCell, 
//   TableContainer, 
//   TableHead, 
//   TableRow, 
//   Paper, 
//   CircularProgress, 
//   Pagination, 
//   Typography 
// } from '@mui/material';

// const ReportsView = () => {
//   const { quizId, userId } = useParams();
//   const { user } = useAuthContext(); // Get user from auth context
//   const isAdmin = user?.role === 'admin'; // Check if user is admin
  
//   const { 
//     reports, 
//     currentReport,
//     loading, 
//     error,
//     getAllReports,
//     getReportsByQuiz,
//     getUserReportByQuiz,
//     getUserReports,
//     clearError 
//   } = useReportContext();

//   const [filteredReports, setFilteredReports] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [reportsPerPage] = useState(5);
//   const [quizTitleFilter, setQuizTitleFilter] = useState('');
//   const [usernameFilter, setUsernameFilter] = useState('');

//   // Calculate current reports for pagination
//   const indexOfLastReport = currentPage * reportsPerPage;
//   const indexOfFirstReport = indexOfLastReport - reportsPerPage;
//   const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);

//   // Handle page change
//   const handlePageChange = (event, newPage) => {
//     setCurrentPage(newPage);
//   };

//   useEffect(() => {
//     const fetchReports = async () => {
//       try {
//         if (quizId && userId) {
//           await getUserReportByQuiz(quizId, userId);
//         } else if (quizId) {
//           await getReportsByQuiz(quizId);
//         } else if (isAdmin) {
//           await getAllReports();
//         } else {
//           await getUserReports();
//         }
//       } catch (err) {
//         // Error handling is managed by the context
//       }
//     };

//     fetchReports();
    
//     return () => {
//       clearError();
//     };
//   }, [quizId, userId, isAdmin]);

//   useEffect(() => {
//     if (!quizId && !userId) {
//       const filtered = reports.filter(report => {
//         const matchesQuizTitle = !quizTitleFilter || 
//           (report.quiz?.title || '').toLowerCase().includes(quizTitleFilter.toLowerCase());
        
//         const matchesUsername = !isAdmin || !usernameFilter || 
//           (report.user?.username || '').toLowerCase().includes(usernameFilter.toLowerCase());
        
//         return matchesQuizTitle && matchesUsername;
//       });

//       setFilteredReports(filtered);
//       setCurrentPage(1);
//     }
//   }, [reports, quizTitleFilter, usernameFilter, isAdmin]);

//   if (loading) {
//     return (
//       <>
//         <Navbar />
//         <div className="flex justify-center items-center h-screen">
//           <CircularProgress />
//         </div>
//       </>
//     );
//   }

//   if (error) {
//     return (
//       <>
//         <Navbar />
//         <div className="flex justify-center items-center h-screen text-red-500">
//           <div className="text-center">
//             <Typography variant="h6" color="error" gutterBottom>{error.message}</Typography>
//             <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
//               Retry
//             </Button>
//           </div>
//         </div>
//       </>
//     );
//   }

//   if (quizId && userId && currentReport) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Navbar />
//         <Container maxWidth="md" className="mt-8">
//           <Paper className="p-8">
//             <Typography variant="h4" className="text-center mb-4">
//               User Quiz Report
//             </Typography>
//             <TableContainer component={Paper} className="mt-4">
//               <Table aria-label="User Report Table">
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>Quiz Title</TableCell>
//                     <TableCell>Total Questions</TableCell>
//                     <TableCell>Correct Answers</TableCell>
//                     <TableCell>Total Score</TableCell>
//                     <TableCell>Completed At</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   <TableRow>
//                     <TableCell>{currentReport.quiz?.title || 'N/A'}</TableCell>
//                     <TableCell>{currentReport.totalQuestions}</TableCell>
//                     <TableCell>
//                       <span className="text-green-500">{currentReport.correctAnswers}</span> / 
//                       <span className="text-red-500">{currentReport.incorrectAnswers}</span>
//                     </TableCell>
//                     <TableCell>{currentReport.totalScore}</TableCell>
//                     <TableCell>{new Date(currentReport.completedAt).toLocaleString()}</TableCell>
//                   </TableRow>
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           </Paper>
//         </Container>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Navbar />
//       <Container maxWidth="lg" className="mt-8 flex flex-col items-center">
//         <Paper className="w-full overflow-hidden">
//           <Typography variant="h4" className="text-center pt-8">
//             {isAdmin ? 'Quiz Reports' : 'My Quiz Reports'}
//           </Typography>
          
//           <div className="flex gap-4 mb-4 justify-center p-4">
//             <TextField 
//               label="Filter by Quiz Title" 
//               variant="outlined" 
//               value={quizTitleFilter} 
//               onChange={(e) => setQuizTitleFilter(e.target.value)} 
//               className="max-w-xs w-full"
//             />
//             {isAdmin && (
//               <TextField 
//                 label="Filter by Username" 
//                 variant="outlined" 
//                 value={usernameFilter} 
//                 onChange={(e) => setUsernameFilter(e.target.value)} 
//                 className="max-w-xs w-full"
//               />
//             )}
//           </div>

//           {filteredReports.length === 0 ? (
//             <Typography variant="h6" className="text-gray-500 text-center py-8">
//               No reports found
//             </Typography>
//           ) : (
//             <TableContainer component={Paper}>
//               <Table>
//                 <TableHead>
//                   <TableRow>
//                     <TableCell>Quiz</TableCell>
//                     {isAdmin && <TableCell>User</TableCell>}
//                     <TableCell>Total Questions</TableCell>
//                     <TableCell>Correct Answers</TableCell>
//                     <TableCell>Total Score</TableCell>
//                     <TableCell>Completed At</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {currentReports.map((report) => (
//                     <TableRow key={report._id}>
//                       <TableCell>{report.quiz?.title || 'N/A'}</TableCell>
//                       {isAdmin && <TableCell>{report.user?.username || 'N/A'}</TableCell>}
//                       <TableCell>{report.totalQuestions}</TableCell>
//                       <TableCell>
//                         <span className="text-green-500">{report.correctAnswers}</span> / 
//                         <span className="text-red-500">{report.incorrectAnswers}</span>
//                       </TableCell>
//                       <TableCell>{report.totalScore}</TableCell>
//                       <TableCell>{new Date(report.completedAt).toLocaleString()}</TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           )}
          
//           <div className="flex justify-center p-4">
//             <Pagination 
//               count={Math.ceil(filteredReports.length / reportsPerPage)} 
//               page={currentPage} 
//               onChange={handlePageChange}
//               color="primary" 
//             />
//           </div>
//         </Paper>
//       </Container>
//     </div>
//   );
// };

// export default ReportsView;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useReportContext } from '../../context/ReportContext';
import { useAuthContext } from '../../context/AuthContext';
import Navbar from '../../components/NavbarComp';
import { 
  Container, 
  TextField, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress, 
  Pagination, 
  Typography 
} from '@mui/material';

const ReportsView = () => {
  const { quizId } = useParams();
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'admin';
  
  const { 
    reports,
    loading, 
    error,
    getAllReports,
    getReportByQuiz,
    clearError 
  } = useReportContext();

  const [filteredReports, setFilteredReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(5);
  const [quizTitleFilter, setQuizTitleFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');

  // Calculate current reports for pagination
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        if (quizId) {
          // Fetch all reports for a specific quiz
          await getReportByQuiz(quizId);
        } else if (isAdmin) {
          // Fetch all reports for admin
          await getAllReports();
        }
      } catch (err) {
        // Error handling is managed by the context
        console.error('Error fetching reports:', err);
      }
    };

    fetchReports();
    
    return () => {
      clearError();
    };
  }, [quizId, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      let filtered = reports;
      
      // Apply filters for admin
      filtered = filtered.filter(report => {
        const matchesQuizTitle = !quizTitleFilter || 
          (report.quiz?.title || '').toLowerCase().includes(quizTitleFilter.toLowerCase());
        
        const matchesUsername = !usernameFilter || 
          (report.user?.username || '').toLowerCase().includes(usernameFilter.toLowerCase());
        
        return matchesQuizTitle && matchesUsername;
      });

      setFilteredReports(filtered);
      setCurrentPage(1);
    }
  }, [reports, quizTitleFilter, usernameFilter, isAdmin]);

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
            <Typography variant="h6" color="error" gutterBottom>{error.message}</Typography>
            <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Container maxWidth="lg" className="mt-8 flex flex-col items-center">
        <Paper className="w-full overflow-hidden">
          <Typography variant="h4" className="text-center pt-8">
            Quiz Reports
          </Typography>
          
          <div className="flex gap-4 mb-4 justify-center p-4">
            <TextField 
              label="Filter by Quiz Title" 
              variant="outlined" 
              value={quizTitleFilter} 
              onChange={(e) => setQuizTitleFilter(e.target.value)} 
              className="max-w-xs w-full"
            />
            <TextField 
              label="Filter by Username" 
              variant="outlined" 
              value={usernameFilter} 
              onChange={(e) => setUsernameFilter(e.target.value)} 
              className="max-w-xs w-full"
            />
          </div>

          {filteredReports.length === 0 ? (
            <Typography variant="h6" className="text-gray-500 text-center py-8">
              No reports found
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Quiz</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Total Questions</TableCell>
                    <TableCell>Correct Answers</TableCell>
                    <TableCell>Total Score</TableCell>
                    <TableCell>Completed At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentReports.map((report) => (
                    <TableRow key={report._id}>
                      <TableCell>{report.quiz?.title || 'N/A'}</TableCell>
                      <TableCell>{report.user?.username || 'N/A'}</TableCell>
                      <TableCell>{report.totalQuestions}</TableCell>
                      <TableCell>
                        <span className="text-green-500">{report.correctAnswers}</span> / 
                        <span className="text-red-500">{report.incorrectAnswers}</span>
                      </TableCell>
                      <TableCell>{report.totalScore}</TableCell>
                      <TableCell>{new Date(report.completedAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          <div className="flex justify-center p-4">
            <Pagination 
              count={Math.ceil(filteredReports.length / reportsPerPage)} 
              page={currentPage} 
              onChange={handlePageChange}
              color="primary" 
            />
          </div>
        </Paper>
      </Container>
    </div>
  );
};

export default ReportsView;
