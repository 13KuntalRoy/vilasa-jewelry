// subscriberController.js

const exceljs = require('exceljs');
const Subscriber = require('../model/subscriber');

exports.addSubscriber = async (req, res) => {
    try {
        console.log(req.body);
        const { email } = req.body;
        
        console.log(email);
        if (!email || !Array.isArray(email) || email.length === 0) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const existingSubscriber = await Subscriber.findOne({ email: { $in: email } });

        if (existingSubscriber) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const newSubscriber = new Subscriber({ email });
        await newSubscriber.save();
        res.status(201).json({ message: 'Subscriber added successfully' });
    } catch (error) {
        console.error('Error adding subscriber:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAllSubscribers = async (req, res) => {
    try {
        
        const subscribers = await Subscriber.find();
        res.status(200).json(subscribers);
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

