import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/NavbarComp";
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
  Pagination,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";

// Custom Styled Components
const DarkBlueTableHead = styled(TableHead)(() => ({
  backgroundColor: "white",
  "& .MuiTableCell-root": {
    color: "#1E3A8A",
    fontWeight: "bold",
    borderBottom: "2px solid #1E3A8A",
  },
}));

const StyledVisibilityIcon = styled(VisibilityIcon)(({ theme }) => ({
  color: theme.palette.info.main,
  "&:hover": {
    color: theme.palette.info.dark,
  },
}));

const StyledDownloadIcon = styled(DownloadIcon)(({ theme }) => ({
  color: theme.palette.success.main,
  "&:hover": {
    color: theme.palette.success.dark,
  },
}));

const ActivityLogPage = () => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);

  // Filtering States
  const [searchTerm, setSearchTerm] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: "",
    endDate: "",
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(6);

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/activity-logs`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch activity logs");
        }

        const data = await response.json();
        if (data.activityLogs && Array.isArray(data.activityLogs)) {
          const processedLogs = data.activityLogs.map((log) => ({
            ...log,
            processedUsername:
              log.details?.username || log.details?.email || "Unknown User",
          }));
          setActivityLogs(processedLogs);
        } else {
          throw new Error("Unexpected response format");
        }
      } catch (error) {
        setError("Failed to fetch activity logs");
      } finally {
        setLoading(false);
      }
    };

    fetchActivityLogs();
  }, []);

  // Filtering Logic
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchesSearch = log.processedUsername
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesActivityType =
        activityTypeFilter === "all" || log.activityType === activityTypeFilter;

      const logDate = new Date(log.createdAt);
      const matchesDateRange =
        (!dateRangeFilter.startDate ||
          logDate >= new Date(dateRangeFilter.startDate)) &&
        (!dateRangeFilter.endDate ||
          logDate <= new Date(dateRangeFilter.endDate));

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

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredLogs.map((log) => ({
      ID: log._id,
      Username: log.processedUsername,
      "Activity Type": log.activityType,
      Details: JSON.stringify(log.details || {}),
      "Created At": new Date(log.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Activity Logs");
    XLSX.writeFile(
      workbook,
      `ActivityLog_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Format Details for Display
  const formatDetails = (details) => {
    if (!details) return "No details available";
    return Object.entries(details)
      .filter(([key, value]) => value !== null)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <Typography variant="h4" align="center" gutterBottom>
          Activity Log
        </Typography>

        {/* Filtering Section */}
        <Grid container spacing={2} style={{ marginBottom: "20px" }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search by Username"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              inputProps={{ "data-testid": "username-search" }}
              id="username-search"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel id="activity-type-label">Activity Type</InputLabel>
              <Select
                labelId="activity-type-label"
                id="activity-type-select"
                value={activityTypeFilter}
                label="Activity Type"
                onChange={(e) => setActivityTypeFilter(e.target.value)}
                data-testid="activity-type-select"
              >
                <MenuItem value="all" data-testid="activity-type-all">
                  All Activities
                </MenuItem>
                <MenuItem value="login" data-testid="activity-type-login">
                  Login
                </MenuItem>
                <MenuItem
                  value="quiz_play"
                  data-testid="activity-type-quiz-play"
                >
                  Quiz Play
                </MenuItem>
                <MenuItem
                  value="quiz_create"
                  data-testid="activity-type-quiz-create"
                >
                  Quiz Create
                </MenuItem>
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
                  onChange={(e) =>
                    setDateRangeFilter((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  inputProps={{ "data-testid": "start-date-input" }}
                  id="start-date-input"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  InputLabelProps={{ shrink: true }}
                  value={dateRangeFilter.endDate}
                  onChange={(e) =>
                    setDateRangeFilter((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  inputProps={{ "data-testid": "end-date-input" }}
                  id="end-date-input"
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={2}>
            <Tooltip title="Export to Excel">
              <IconButton
                data-testid="export-button"
                onClick={exportToExcel}
                aria-label="export to excel"
                id="export-button"
              >
                <StyledDownloadIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>

        {/* Logs Table */}
        {loading ? (
          <CircularProgress
            data-testid="loading-spinner"
            id="loading-spinner"
          />
        ) : error ? (
          <Alert
            severity="error"
            data-testid="error-alert"
            id="error-alert"
            role="alert"
          >
            {error}
          </Alert>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table id="activity-log-table" data-testid="activity-log-table">
                <DarkBlueTableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Activity Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </DarkBlueTableHead>
                <TableBody data-testid="activity-log-table-body">
                  {currentLogs.map((log) => (
                    <TableRow key={log._id} data-testid={`log-row-${log._id}`}>
                      <TableCell data-testid={`username-cell-${log._id}`}>
                        {log.processedUsername}
                      </TableCell>
                      <TableCell data-testid={`activity-type-cell-${log._id}`}>
                        {log.activityType}
                      </TableCell>
                      <TableCell data-testid={`date-cell-${log._id}`}>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell data-testid={`actions-cell-${log._id}`}>
                        <IconButton
                          data-testid={`view-details-button-${log._id}`}
                          onClick={() => setSelectedDetails(log)}
                          aria-label={`view details for ${log.processedUsername}`}
                        >
                          <StyledVisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                data-testid="activity-log-pagination"
                id="activity-log-pagination"
              />
            </Box>
          </>
        )}

        {/* Details Modal */}
        {selectedDetails && (
          <Modal
            open={true}
            onClose={() => setSelectedDetails(null)}
            data-testid="details-modal"
            id="details-modal"
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
                bgcolor: "background.paper",
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
              }}
              data-testid="modal-content"
            >
              <IconButton
                data-testid="close-modal-button"
                onClick={() => setSelectedDetails(null)}
                style={{ position: "absolute", top: 10, right: 10 }}
                aria-label="close modal"
              >
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" gutterBottom data-testid="modal-title">
                Activity Details
              </Typography>
              <Typography data-testid="modal-username">
                <strong>User:</strong> {selectedDetails.processedUsername}
              </Typography>
              <Typography data-testid="modal-activity-type">
                <strong>Activity Type:</strong> {selectedDetails.activityType}
              </Typography>
              <Typography data-testid="modal-date">
                <strong>Date:</strong>{" "}
                {new Date(selectedDetails.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="subtitle1" style={{ marginTop: 16 }}>
                <strong>Details:</strong>
              </Typography>
              <pre
                style={{
                  backgroundColor: "#f4f4f4",
                  padding: "10px",
                  borderRadius: "4px",
                  overflowX: "auto",
                }}
                data-testid="modal-details"
              >
                {formatDetails(selectedDetails.details)}
              </pre>
            </Box>
          </Modal>
        )}
      </div>
    </>
  );
};

export default ActivityLogPage;
