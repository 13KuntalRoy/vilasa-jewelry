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

exports.downloadSubscribersAsExcel = async (req, res) => {
    try {
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Subscribers');
        worksheet.columns = [{ header: 'Email', key: 'email' }];

        // Find all subscribers
        const allSubscribers = await Subscriber.find();

        // Check if subscribers exist
        if (!allSubscribers || allSubscribers.length === 0) {
            return res.status(404).json({ error: 'No subscribers found' });
        }

        // Add each email to the worksheet
        allSubscribers.forEach(subscriber => {
            subscriber.email.forEach(email => {
                worksheet.addRow({ email });
            });
        });

        // Set headers to force download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=subscribers.xlsx');

        // Debug: Log the generated Excel file
        // console.log('Generated Excel:', workbook);

        // Send the Excel file as a response
        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
