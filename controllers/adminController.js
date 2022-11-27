//Controller for admin
import User from "../model/schemas/User.js";
import bcrypt from "bcrypt";
import db from "../model/db.js";
import { ReturnDocument } from "mongodb";

const adminController = {
    accountManagement: function (req, res) {
        res.render("accountManagement", {
            title: "Account Management",
            styles: [
                "pages/accountManagement.css",
                "pages/index.css",
                "general/w2ui-overrides.css",
                "general/popup.css",
            ],
            scripts: ["accountManagement.js", "index.js"],
            user: { isAdmin: req.session.user.isAdmin, username: req.session.user.username },
        });
    },

    // Get all users
    getUsers: async function (req, res) {
        try {
            const users = await User.find();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: "Server Error: Get Users", details: error.message });
        }
    },
    // Get a user
    getUser: async function (req, res) {
        try {
            const user = await User.findById(req.params.id);
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: "Server Error: Get User", details: error.message });
        }
    },

    // Add new user
    addUser: async function (req, res) {
        try {
            //Check if the user already exists
            const user = await User.findOne({ username: req.body.username });
            if (user) {
                res.status(403).json({ message: "User already exists" });
                return;
            }
            var error = "";
            var errorFields = [];
            var nameRegex = /^([a-zA-Z\s.-]+)$/;
            var alphanumeric = /^([a-zA-Z0-9]+)$/;
            var alphaNumSymbols = /^([a-zA-Z0-9!@#$%^&*]+)$/;

            var firstName = req.body.firstName;
            var lastName = req.body.lastName;

            //Removes excess spaces at the start and end of the name string
            firstName = firstName.trim();
            lastName = lastName.trim();

            //Removes multiple spaces in between
            firstName = firstName.replace(/\s\s+/g, ' ');
            lastName = lastName.replace(/\s\s+/g, ' ');

            console.log("After trim and replace");
            console.log(firstName);
            console.log(lastName);

            //Create a new user
            const newUser = {
                username: req.body.username,
                password: req.body.password,
                firstName: firstName,
                lastName: lastName,
                dateCreated: req.body.dateCreated,
            };

            if (String(newUser.username).length < 4) {
                error = "Username is less than 4 characters";
                errorFields = ["create-username"];
            } else if (String(newUser.username).length > 100) {
                error = "Username exceeds 100 characters";
                errorFields = ["create-username"];
            } else if (!String(newUser.username).match(alphanumeric)){
                error = "Username is not alphanumeric";
                errorFields = ["create-username"];
            } else if (!String(newUser.firstName).match(nameRegex)){
                error = "First name contains characters not in the alphabet";
                errorFields = ["create-first-name"];
            } else if(!String(newUser.lastName).match(nameRegex)){
                error = "Last name contains characters not in the alphabet";
                errorFields = ["create-last-name"];
            } else if (String(newUser.password).length < 6) {
                error = "Password is less than 6 characters";
                errorFields = ["create-password"];
            } else if (String(newUser.password).length > 100) {
                error = "Password exceeds 100 characters";
                errorFields = ["create-password"];
            } else if(!String(newUser.password).match(alphaNumSymbols)){
                error = "Password contains non-alphanumeric symbols that isn't !@#$%^&*";
                errorFields = ["create-password"];
            } else {
                //Hash the password
                const salt = await bcrypt.genSalt(10);
                var hashedPassword = await bcrypt.hash(newUser.password, salt);
                newUser.password = hashedPassword;
                db.insertOne(User, newUser, function (data) {
                    res.send(data);
                });
                return;
            }
            res.status(400).json({ message: error, fields: errorFields });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Server Error: Add User", details: error.message });
            return;
        }
    },

    // Update a user
    updateUser: async function (req, res) {
        try {
            //Check if the user is admin
            if (!req.session.user.isAdmin) {
                res.status(403).json({ message: "User is not admin" });
                return;
            }

            //Check if the user already exists
            const user = await User.findById(req.body.id);
            if (!user) {
                res.status(404).json({ message: "User does not exist" });
                return;
            }

            var error = "";
            var errorFields = [];
            var alphanumeric = /^([a-zA-Z0-9]+)$/;

            const updatedUser = {
                username: req.body.username,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                dateUpdated: req.body.dateUpdated,
            };

            if (String(updatedUser.username).length < 4) {
                error = "Username is less than 4 characters";
                errorFields = ["update-username"];
            } else if (String(updatedUser.username).length > 100) {
                error = "Username exceeds 100 characters";
                errorFields = ["update-username"];
            } else if (!String(updatedUser.username).match(alphanumeric)){
                error = "Username is not alphanumeric";
                errorFields = ["update-username"];
            } else {
                db.updateOne(User, { _id: req.body.id }, updatedUser, function (data) {
                    res.send(data);
                });
                return;
            }
            res.status(400).json({ message: error, fields: errorFields });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Server Error: Update User", details: error.message });
            return;
        }
    },

    // Reset password of user
    resetPassword: async function (req, res) {
        try {
            //Check if the user is admin
            if (!req.session.user.isAdmin) {
                res.status(403).json({ message: "User is not admin" });
                return;
            }

            //Check if the user already exists
            const user = await User.findById(req.body.id);
            if (!user) {
                res.status(404).json({ message: "User does not exist" });
                return;
            }
            const salt = await bcrypt.genSalt(10);
            var hashedPassword = await bcrypt.hash("password", salt);
            const resetUser = {
                password: hashedPassword,
            };
            db.updateOne(User, { _id: req.body.id }, resetUser, function (data) {
                res.send(data);
            });
            return;
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Server Error: Reset User", details: error.message });
            return;
        }
    },

    // Suspend a user
    suspendUser: async function (req, res) {
        try {
            //Check if the user is admin
            if (!req.session.user.isAdmin) {
                res.status(403).json({ message: "User is not admin" });
                return;
            }

            //Check if the user already exists
            const user = await User.findById(req.body.id);
            if (!user) {
                res.status(404).json({ message: "User does not exist" });
                return;
            }
            const suspendUser = {
                isSuspended: true,
            };

            db.updateOne(User, { _id: req.body.id }, suspendUser, function (data) {
                res.send(data);
            });
            return;
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Server Error: Suspend User", details: error.message });
            return;
        }
    },

    // Resume a user
    resumeUser: async function (req, res) {
        try {
            //Check if the user is admin
            if (!req.session.user.isAdmin) {
                res.status(403).json({ message: "User is not admin" });
                return;
            }

            //Check if the user already exists
            const user = await User.findById(req.body.id);
            if (!user) {
                res.status(404).json({ message: "User does not exist" });
                return;
            }
            const suspendUser = {
                isSuspended: false,
            };

            db.updateOne(User, { _id: req.body.id }, suspendUser, function (data) {
                res.send(data);
            });
            return;
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Server Error: Suspend User", details: error.message });
            return;
        }
    },

    changePassword: function (req, res) {
        res.render("changePassword", {
            title: "Change Password",
            styles: [
                "pages/changePassword.css",
                "general/sidebar.css"
            ],
            scripts: ["changePassword.js"],
            user: { isAdmin: req.session.user.isAdmin, username: req.session.user.username },
        });
    },

    changeOwnPassword: async function (req, res) {
        try {
            console.log(req.session.user)
            var error = "";
            var errorFields = [];
            const updatedPassword = req.body.newPassword;
            const oldHashedPassword = "";
            var alphanumeric = /^([a-zA-Z0-9]+)$/;
            var alphaNumSymbols = /^([a-zA-Z0-9!@#$%^&*]+)$/;

            //Hash the password
            const salt = await bcrypt.genSalt(10);
            var hashedPassword = await bcrypt.hash(updatedPassword, salt);

            db.findOne(User, {username: req.session.user}, {}, function (data) {
                console.log(data)
                oldHashedPassword = data.password;
            })

            if (String(updatedPassword).length < 6) {
                error = "Password is less than 6 characters";
                errorFields = ["update-password"];
            } else if (String(updatedPassword).length > 100) {
                error = "Password exceeds 100 characters";
                errorFields = ["update-password"];
            } else if (updatedPassword != req.params.confirm) {
                error = "Password does not match";
                errorFields = ["update-password", "confirm-password"];
            } else if (hashedPassword == oldHashedPassword) {
                error = "Password is the same as old password";
                errorFields = ["update-password"];
            } else {
                //Update the password
                db.updateOne(User, {username: req.session.user}, {password: updatedPassword}, function (data) {
                    res.send(data);
                } )
                return;
            }
            res.status(400).json({ message: error, fields: errorFields });

        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Server Error: Update Password", details: error.message });
            return;
        }
    },
};

export default adminController;