const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth'); // Import auth routes
const Owner = require('./models/owner');
const Employee = require('./models/Employee');
const Menu = require('./models/Menu');
const TableStatus = require('./models/TableStatus');
const OrderHistory = require('./models/Orderhistory');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

connectDB();

// Use the auth routes
app.use('/api/auth', authRoutes);

// Middleware to Authenticate (Verify Token)
const authenticate = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, 'yourSecretKey');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Get User Profile (Role)
app.get('/api/auth/profile', authenticate, async (req, res) => {
    try {
        let user;
        let role;

        // Check in Owner model
        user = await Owner.findById(req.user.id);
        if (user) {
            role = 'owner';
        } else {
            // If not found in Owner, check in Employee
            user = await Employee.findById(req.user.id);
            if (user) {
                role = 'employee';
            } else {
                return res.status(404).json({ msg: 'User not found' });
            }
        }

        res.json({ role: role });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Route to handle Employee assignment
app.post('/api/auth/assign-employee', authenticate, async (req, res) => {
    try {
        const { employeeId, ownerId } = req.body;

        console.log("Attempting to assign:", { employeeId, ownerId });

        // Validation: Check for missing data
        if (!employeeId || !ownerId) {
            console.error("Error: Employee ID or Owner ID missing");
            return res.status(400).json({ msg: "Error: Employee ID and Owner ID are required." });
        }

        // 1. Check if the employee exists
        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
            console.log("Employee not found");
            return res.status(404).json({ msg: "Employee not found." });
        }

        // 2. Check if the employee is already assigned to another restaurant
        if (employee.ownerId) {
            console.log("Employee already assigned to restaurant:", employee.ownerId);
            return res.status(400).json({ msg: `Employee already assigned to another restaurant (ID: ${employee.ownerId})` });
        }

        // 3. Find the owner
        const owner = await Owner.findOne({ ownerId });
        if (!owner) {
            console.log("Owner not found");
            return res.status(404).json({ msg: "Owner not found." });
        }

        // 4. Check if the employee is already in the owner's employee list (for extra safety)
        if (owner.employeeIds.includes(employeeId)) {
            console.log("Employee already in owner's list");
            return res.status(400).json({ msg: "Employee already assigned to this restaurant." });
        }

        // 5. Update Employee and Owner
        employee.ownerId = owner.ownerId;
        await employee.save();
        owner.employeeIds.push(employee.employeeId);
        await owner.save();

        console.log("Employee assigned successfully");
        res.json({ msg: "Employee assigned successfully!" });

    } catch (error) {
        console.error("Error assigning employee:", error);
        res.status(500).json({ msg: "Server error" });
    }
});

// **NEW ROUTES TO FETCH EMPLOYEE DATA**

// GET /api/employees/ids  (Get all Employee IDs)
app.get('/api/employees/ids', authenticate, async (req, res) => {
    try {
        const employees = await Employee.find();
        const employeeIds = employees.map(employee => employee.employeeId);
        res.json(employeeIds);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// GET /api/employees/:employeeId (Get Employee Details by ID)
app.get('/api/employees/:employeeId', authenticate, async (req, res) => {
    try {
        const employee = await Employee.findOne({ employeeId: req.params.employeeId });
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }
        //omit password
        const { password, ...employeeDetails } = employee.toObject();
        res.json(employeeDetails);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

//Delete employee
app.patch('/api/employees/unassign/:employeeId', authenticate, async (req, res) => {
    try {
        const { employeeId } = req.params;

        // 1. Find the employee
        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        // 2. Remove employee from Owner's employeeIds array
        await Owner.updateMany(
            { employeeIds: employeeId },
            { $pull: { employeeIds: employeeId } }
        );

        // 3. Update the employee's ownerId to null
        employee.ownerId = null;
        await employee.save();

        res.json({ msg: 'Employee unassigned successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// **MENU ROUTES**

// GET /api/menu/:ownerId - Get menu for a specific owner
//  GET /api/menu/:ownerId - Get menu for a specific owner
app.get('/api/menu/:ownerId', authenticate, async (req, res) => {
    try {
        const userId = req.user.id; //  Get user's _id from JWT
        let ownerId;

        //  Determine ownerId based on user role
        const owner = await Owner.findById(userId);
        if (owner) {
            ownerId = owner.ownerId;
        } else {
            const employee = await Employee.findById(userId);
            if (employee) {
                ownerId = employee.ownerId;
            } else {
                return res.status(404).json({ msg: 'User not found' });
            }
        }

        if (!ownerId) {
            return res.status(400).json({ msg: 'Owner ID not found for user' });
        }

        const menu = await Menu.findOne({ ownerId: ownerId });
        if (menu) {
            res.json(menu.items); //  Send only the items array
        } else {
            res.json([]); //  Send an empty array if no menu found
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// POST /api/menu/:ownerId - Add a new item to the menu
app.post('/api/menu/:ownerId', authenticate, async (req, res) => {
    try {
        const { name, price } = req.body;
        const userId = req.user.id; // Get user's _id from JWT
        const owner = await Owner.findById(userId); // Find the owner
        if (!owner) {
            return res.status(404).json({ msg: 'Owner not found' });
        }
        const ownerId = owner.ownerId; // Extract ownerId

        if (!name || !price) {
            return res.status(400).json({ msg: 'Please provide item name and price' });
        }

        let menu = await Menu.findOne({ ownerId: ownerId });

        if (!menu) {
            // Create a new menu if one doesn't exist
            menu = new Menu({ ownerId: ownerId, items: [{ name, price }] });
            await menu.save();
        } else {
            // Add the new item to the existing menu's items array
            menu.items.push({ name, price });
            await menu.save();
        }

        res.json({ msg: 'Item added to menu' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// DELETE /api/menu/items/:itemId - Remove an item from the menu
app.delete('/api/menu/items/:itemId', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const owner = await Owner.findById(userId);
        if (!owner) {
            return res.status(404).json({ msg: 'Owner not found' });
        }
        const ownerId = owner.ownerId;
        const itemId = req.params.itemId;

        let menu = await Menu.findOne({ ownerId: ownerId });
        if (!menu) {
            return res.status(404).json({ msg: 'Menu not found' });
        }

        // Filter out the item to remove
        menu.items = menu.items.filter(item => item._id.toString() !== itemId);
        await menu.save();

        res.json({ msg: 'Item removed from menu' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

//  GET /api/tables/:ownerId - Get the status of all tables for a specific owner
app.get('/api/tables/:ownerId', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        let ownerId;

        //  Determine ownerId based on user role (same as before)
        const owner = await Owner.findById(userId);
        if (owner) {
            ownerId = owner.ownerId;
        } else {
            const employee = await Employee.findById(userId);
            if (employee) {
                ownerId = employee.ownerId;
            } else {
                return res.status(404).json({ msg: 'User not found' });
            }
        }

        if (!ownerId) {
            return res.status(400).json({ msg: 'Owner ID not found for user' });
        }

        const ownerWithTables = await Owner.findOne({ ownerId: ownerId }).select('tables'); //  Fetch only the 'tables'
        if (!ownerWithTables) {
            return res.status(404).json({ msg: 'Owner not found' });
        }

        res.json(ownerWithTables.tables); //  Send the tables Map
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// PUT /api/tables/:ownerId/:tableNumber - Update the status of a specific table
app.put('/api/tables/:ownerId/:tableNumber', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        let ownerId;

        //  Determine ownerId based on user role (same as before)
        const owner = await Owner.findById(userId);
        if (owner) {
            ownerId = owner.ownerId;
        } else {
            const employee = await Employee.findById(userId);
            if (employee) {
                ownerId = employee.ownerId;
            } else {
                return res.status(404).json({ msg: 'User not found' });
            }
        }

        if (!ownerId) {
            return res.status(400).json({ msg: 'Owner ID not found for user' });
        }

        const tableNumber = req.params.tableNumber;
        const { status } = req.body; // 0 for available, 1 for occupied

        const ownerWithTables = await Owner.findOne({ ownerId: ownerId });
        if (!ownerWithTables) {
            return res.status(404).json({ msg: 'Owner not found' });
        }

        if (!ownerWithTables.tables.has(tableNumber)) {  //  Use .has() to check for a key
            return res.status(400).json({ msg: `Table ${tableNumber} does not exist` });
        }

        ownerWithTables.tables.set(tableNumber, status);  //  Use .set() to update
        await ownerWithTables.save();

        res.json({ msg: `Table ${tableNumber} status updated` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// **ORDER ROUTES**

// POST /api/orders - Create a new order
app.post('/api/orders', authenticate, async (req, res) => {
    try {
        const { tableNumber, customerName, customerMobile, items } = req.body;
        const userId = req.user.id;
        let ownerId;

        // Determine ownerId
        const owner = await Owner.findById(userId);
        if (owner) {
            ownerId = owner.ownerId;
        } else {
            const employee = await Employee.findById(userId);
            if (employee) {
                ownerId = employee.ownerId;
            } else {
                return res.status(404).json({ msg: 'User not found' });
            }
        }

        if (!ownerId || !tableNumber || !customerName || !customerMobile || !items || items.length === 0) {
            return res.status(400).json({ msg: 'Missing order details' });
        }

        // Calculate total amount
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += item.price * item.quantity;
        }

        const order = new OrderHistory({  //  Save directly to OrderHistory
            ownerId: ownerId,
            tableNumber: tableNumber,
            customerName: customerName,
            customerMobile: customerMobile,
            items: items.map(item => ({
                itemId: item.itemId,
                quantity: item.quantity,
                name: item.name,
                price: item.price
            })),
            totalAmount: totalAmount
        });

        await order.save();

        res.status(201).json({ msg: 'Order created successfully!', orderId: order._id });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ msg: 'Server error while creating order' });
    }
});

// GET /api/orders/history/:ownerId - Get order history for a specific owner
app.get('/api/orders/history/:ownerId', authenticate, async (req, res) => {
    try {
        const ownerId = req.params.ownerId;

        const orders = await OrderHistory.find({ ownerId: ownerId }).select('-ownerId'); // Exclude ownerId from the results

        res.json(orders);
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).json({ msg: 'Server error while fetching order history' });
    }
});


app.listen(port, () => console.log(`Server started on port ${port}`));