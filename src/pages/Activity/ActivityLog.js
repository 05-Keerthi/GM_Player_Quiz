import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/NavbarComp";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
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
  Tooltip as MuiTooltip,
  Pagination,
  Card,
  CardContent,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

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

  // Dashboard Data Processing
  const dashboardData = useMemo(() => {
    if (!activityLogs.length)
      return { activityTypes: [], dailyActivity: [], userActivity: [] };

    const activityTypeCount = activityLogs.reduce((acc, log) => {
      acc[log.activityType] = (acc[log.activityType] || 0) + 1;
      return acc;
    }, {});

    const activityTypes = Object.entries(activityTypeCount).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    const dailyCount = activityLogs.reduce((acc, log) => {
      const date = new Date(log.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const dailyActivity = Object.entries(dailyCount)
      .map(([date, count]) => ({
        date,
        activities: count,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7);

    const userCount = activityLogs.reduce((acc, log) => {
      acc[log.processedUsername] = (acc[log.processedUsername] || 0) + 1;
      return acc;
    }, {});

    const userActivity = Object.entries(userCount)
      .map(([name, value]) => ({
        name,
        activities: value,
      }))
      .sort((a, b) => b.activities - a.activities)
      .slice(0, 5);

    return { activityTypes, dailyActivity, userActivity };
  }, [activityLogs]);

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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <CircularProgress
            data-testid="loading-spinner"
            id="loading-spinner"
          />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="p-4">
          <Alert
            severity="error"
            data-testid="error-alert"
            id="error-alert"
            role="alert"
          >
            {error}
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-5">
        <Typography variant="h4" align="center" gutterBottom>
          Activity Log Dashboard
        </Typography>

        {/* Dashboard Charts */}
        <Grid container spacing={4} className="mb-8">
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper className="p-4">
                      <Typography
                        variant="h3"
                        className="text-center text-blue-600"
                      >
                        {activityLogs.length}
                      </Typography>
                      <Typography className="text-center">
                        Total Activities
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper className="p-4">
                      <Typography
                        variant="h3"
                        className="text-center text-green-600"
                      >
                        {
                          new Set(
                            activityLogs.map((log) => log.processedUsername)
                          ).size
                        }
                      </Typography>
                      <Typography className="text-center">
                        Unique Users
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper className="p-4">
                      <Typography
                        variant="h3"
                        className="text-center text-purple-600"
                      >
                        {
                          new Set(activityLogs.map((log) => log.activityType))
                            .size
                        }
                      </Typography>
                      <Typography className="text-center">
                        Activity Types
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Activity Distribution
                </Typography>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={dashboardData.activityTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboardData.activityTypes.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Daily Activity
                </Typography>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={dashboardData.dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="activities" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
            <MuiTooltip title="Export to Excel">
              <IconButton
                onClick={exportToExcel}
                data-testid="export-button"
                id="export-button"
                aria-label="export to excel"
              >
                <StyledDownloadIcon />
              </IconButton>
            </MuiTooltip>
          </Grid>
        </Grid>

        {/* Activity Logs Table */}
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
