const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth, isAdminOrTenantAdmin } = require("../middlewares/auth");

// Routes accessible by both admin and tenant_admin
router.get("/users", auth, isAdminOrTenantAdmin, userController.getAllUsers);
router.get("/users/:id", auth, isAdminOrTenantAdmin, userController.getUserById);
router.delete("/users/:id", auth, isAdminOrTenantAdmin, userController.deleteUser);

// Routes accessible by any authenticated user (for their own profile)
router.put("/users/:id", auth, userController.updateUser);
router.post("/change-password", auth, userController.changePassword);

module.exports = router;