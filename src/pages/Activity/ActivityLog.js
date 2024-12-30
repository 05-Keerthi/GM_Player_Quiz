import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/NavbarComp';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,                                                                                                                                                                                                                                                                                                                                                                                 
  Paper,
  Modal,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Tooltip,
  Pagination
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';

// Custom Styled Components
const DarkBlueTableHead = styled(TableHead)(() => ({
  backgroundColor: 'white',
  '& .MuiTableCell-root': {
    color: '#1E3A8A', // Dark blue color for font
    fontWeight: 'bold',
    borderBottom: '2px solid #1E3A8A',
  }
}));

const StyledVisibilityIcon = styled(VisibilityIcon)(({ theme }) => ({
  color: theme.palette.info.main,
  '&:hover': {
    color: theme.palette.info.dark,
  }
}));

const StyledDownloadIcon = styled(DownloadIcon)(({ theme }) => ({
  color: theme.palette.success.main,
  '&:hover': {
    color: theme.palette.success.dark,
  }
}));

const ActivityLogPage = () => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);

  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: '',
    endDate: '',
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(6); // Changed to 7 items per page

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/activity-logs`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch activity logs');
        }

        const data = await response.json();
        if (data.activityLogs && Array.isArray(data.activityLogs)) {
          const processedLogs = data.activityLogs.map(log => ({
            ...log,
            processedUsername: log.details?.username || log.details?.email || 'Unknown User',
          }));
          setActivityLogs(processedLogs);
        } else {
          throw new Error('Unexpected response format');
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityLogs();
  }, []);

  // Filtering Logic
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchesSearch = 
        log.processedUsername.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesActivityType = 
        activityTypeFilter === 'all' || log.activityType === activityTypeFilter;
      
      const logDate = new Date(log.createdAt);
      const matchesDateRange = 
        (!dateRangeFilter.startDate || logDate >= new Date(dateRangeFilter.startDate)) &&
        (!dateRangeFilter.endDate || logDate <= new Date(dateRangeFilter.endDate));
      
      return matchesSearch && matchesActivityType && matchesDateRange;
    });
  }, [activityLogs, searchTerm, activityTypeFilter, dateRangeFilter]);

  // Pagination Logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Export to Excel with Specific Format
  const exportToExcel = () => {
    const exportData = filteredLogs.map(log => ({
      'ID': log._id,
      'Username': log.processedUsername,
      'Activity Type': log.activityType,
      'Details': JSON.stringify(log.details || {}),
      'Created At': new Date(log.createdAt).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Activity Logs");
    XLSX.writeFile(workbook, `ActivityLog_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Format Details for Display
  const formatDetails = (details) => {
    if (!details) return 'No details available';
    
    return Object.entries(details)
      .filter(([key, value]) => value !== null)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  // Render Details Modal
  const renderDetailsModal = () => {
    if (!selectedDetails) return null;

    const { activityType, details, processedUsername } = selectedDetails;

    return (
      <Modal 
        open={!!selectedDetails} 
        onClose={() => setSelectedDetails(null)}
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}>
          <IconButton 
            onClick={() => setSelectedDetails(null)}
            style={{ position: 'absolute', top: 10, right: 10 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" gutterBottom>
            Activity Details
          </Typography>
          
          <Typography><strong>User:</strong> {processedUsername}</Typography>
          <Typography><strong>Activity Type:</strong> {activityType}</Typography>
          <Typography><strong>Date:</strong> {new Date(selectedDetails.createdAt).toLocaleString()}</Typography>
          
          <Typography variant="subtitle1" style={{ marginTop: 16 }}>
            <strong>Details:</strong>
          </Typography>
          <pre style={{ 
            backgroundColor: '#f4f4f4', 
            padding: '10px', 
            borderRadius: '4px', 
            overflowX: 'auto' 
          }}>
            {formatDetails(details)}
          </pre>
        </Box>
      </Modal>
    );
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Activity Log
        </Typography>

        {/* Filtering Section */}
        <Grid container spacing={2} style={{ marginBottom: '20px' }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search by Username"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Activity Type</InputLabel>
              <Select
                value={activityTypeFilter}
                label="Activity Type"
                onChange={(e) => setActivityTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Activities</MenuItem>
                <MenuItem value="login">Login</MenuItem>
                <MenuItem value="quiz_play">Quiz Play</MenuItem>
                <MenuItem value="quiz_create">Quiz Create</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  InputLabelProps={{ shrink: true }}
                  value={dateRangeFilter.startDate}
                  onChange={(e) => setDateRangeFilter(prev => ({
                    ...prev, 
                    startDate: e.target.value
                  }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  InputLabelProps={{ shrink: true }}
                  value={dateRangeFilter.endDate}
                  onChange={(e) => setDateRangeFilter(prev => ({
                    ...prev, 
                    endDate: e.target.value
                  }))}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={2}>
            <Tooltip title="Export to Excel">
              <IconButton>
                <StyledDownloadIcon onClick={exportToExcel} />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>

        {/* Logs Table */}
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <DarkBlueTableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Activity Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </DarkBlueTableHead>
                <TableBody>
                  {currentLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>{log.processedUsername}</TableCell>
                      <TableCell>{log.activityType}</TableCell>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => setSelectedDetails(log)}>
                          <StyledVisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination 
                count={totalPages} 
                page={currentPage} 
                onChange={handlePageChange} 
                color="primary"
                size="large"
              />
            </Box>
          </>
        )}

        {/* Details Modal */}
        {renderDetailsModal()}
      </div>
    </>
  );
};

export default ActivityLogPage;