// auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Owner = require('../models/owner');
const Employee = require('../models/Employee');
const TableStatus = require('../models/TableStatus');
const auth = require('../middleware/auth');

// Function to generate a 6-digit random number
function generateRandomId() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Registration Route for Owner
router.post('/register/owner', async (req, res) => {
    const { name, email, password, restaurantName, noOfTables } = req.body;

    if (!name || !email || !password || !restaurantName || !noOfTables) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        // Check if email already exists in either model
        const existingOwner = await Owner.findOne({ email });
        const existingEmployee = await Employee.findOne({ email });
        if (existingOwner || existingEmployee) {
            return res.status(400).json({ msg: 'Email already registered as Owner or Employee' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const ownerId = `R${generateRandomId()}`;
        const newOwner = new Owner({
            ownerId: String(ownerId),
            name,
            email,
            password: hashedPassword,
            restaurantName,
            noOfTables: noOfTables
        });

        // Initialize table status directly in the Owner document
        for (let i = 1; i <= noOfTables; i++) {
            newOwner.tables.set(`table-${i}`, 0); //  Use .set() to add to the Map
        }

        await newOwner.save();

        res.json({ ownerId: ownerId });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Registration Route for Employee
router.post('/register/employee', async (req, res) => {
    const { name, email, password, mobile, age, address } = req.body;

    if (!name || !email || !password || !mobile || !age || !address) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        // Check if email already exists in either model
        const existingOwner = await Owner.findOne({ email });
        const existingEmployee = await Employee.findOne({ email });
        if (existingOwner || existingEmployee) {
            return res.status(400).json({ msg: 'Email already registered as Owner or Employee' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const employeeId = `E${generateRandomId()}`;
        const newEmployee = new Employee({
            employeeId: String(employeeId),
            name,
            email,
            password: hashedPassword,
            mobile,
            age,
            address
        });

        await newEmployee.save();
        res.json({ employeeId: employeeId });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login Route (unchanged)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter email and password' });
    }

    try {
        // Check in Owner model
        let user = await Owner.findOne({ email });
        let role = 'owner';

        // If not found in Owner, check in Employee
        if (!user) {
            user = await Employee.findOne({ email });
            role = 'employee';
        }

        if (!user) {
            return res.status(400).json({ msg: 'Email is not Registered, Please Register First !!!!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user._id,
                role: role
            }
        };

        jwt.sign(payload, 'yourSecretKey', { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, userId: user._id, role: role });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// fetch datas for profilr
router.get('/profile', auth, async (req, res) => {
    try {
        let user;
        let userData = {};

        if (req.user.role === 'owner') {
            user = await Owner.findById(req.user.id).select('-password -__v');
            if (!user) {
                return res.status(404).json({ msg: 'Owner not found' });
            }
            userData = {
                name: user.name,
                email: user.email,
                ownerId: user.ownerId,
                restaurantName: user.restaurantName,
                noOfTables: user.noOfTables,
                role: req.user.role,
                employeeIds: user.employeeIds
            };
            console.log("Profile route - Sending ownerId:", userData.ownerId); // ADD THIS
        } else {
            user = await Employee.findById(req.user.id).select('-password -__v');
            if (!user) {
                return res.status(404).json({ msg: 'Employee not found' });
            }
            userData = {
                name: user.name,
                email: user.email,
                employeeId: user.employeeId,
                role: req.user.role,
                mobile: user.mobile,
                age: user.age,
                address: user.address,
                ownerId: user.ownerId
            };
        }

        console.log("Backend Response:", userData);
        res.json(userData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//  Change Password Route  (NEW)
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        let user;

        if (req.user.role === 'owner') {
            user = await Owner.findById(req.user.id);
        } else {
            user = await Employee.findById(req.user.id);
        }

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // 1. Check if current password is correct
        const isCurrentMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentMatch) {
            return res.status(400).json({ msg: 'Invalid current password' });
        }

        // 2. Check if new password is same as current
        const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
        if (isSameAsCurrent) {
            return res.status(400).json({ msg: 'New password must be different from current password' });
        }

        // 3. Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ msg: 'Password updated successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;