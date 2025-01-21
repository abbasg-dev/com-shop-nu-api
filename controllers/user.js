import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';

const create = asyncHandler(async (req, res) => {
    const { email } = req.body
    const userExists = await User.findOne({ email })
    if (userExists) {
        res.status(400).send('User already exists')
    } else {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            passwordHash: bcrypt.hashSync(req.body.passwordHash, 10),
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country
        });
        const createdUser = await user.save()
        if (user) {
            res.status(201).json(createdUser);
        } else {
            res.status(500).send('Invalid user data')
        }
    }
});

const list = asyncHandler(async (req, res) => {
    const userList = await User.find().select('-passwordHash');

    if (!userList) {
        res.status(500).json({ success: false })
    }
    res.send(userList);
});

const userById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if (!user) {
        res.status(500).json({ message: 'The user with the given ID was not found.' })
    }
    res.status(200).send(user);
});

const updateUser = asyncHandler(async (req, res) => {
    const userIdExists = await User.findById(req.params.id);
    const userEmailExists = await User.findOne({ _id: { $ne: userIdExists }, "email": req.body.email });
    if (userEmailExists) {
         res.status(409).send('Email is already taken')
    } else {
        let newPassword
        if (req.body.passwordHash) {
            newPassword = bcrypt.hashSync(req.body.passwordHash, 10)
        } else {
            newPassword = userIdExists.passwordHash;
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                email: req.body.email,
                passwordHash: newPassword,
                phone: req.body.phone,
                isAdmin: req.body.isAdmin,
                street: req.body.street,
                apartment: req.body.apartment,
                zip: req.body.zip,
                city: req.body.city,
                country: req.body.country,
            },
            { new: true }
        )
        if (!user)
             res.status(400).send('Invalid user data')
        res.send(user);
    }
});

const countUsers = asyncHandler(async (req, res) => {
    const userCount = await User.countDocuments()
    if(!userCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        userCount: userCount
    });
})

const remove = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
    if (user) {
        await user.remove()
        res.json({
            message: 'User removed',
            success: true
        })
    } else {
        res.status(404).json({
            message: 'User not Found',
            success: false
        })
    }
});

export {
    create,
    list,
    userById,
    updateUser,
    countUsers,
    remove
}