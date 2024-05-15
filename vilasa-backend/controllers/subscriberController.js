const exceljs = require('exceljs');
const Subscriber = require('../model/subscriber');

exports.addSubscriber = (req, res) => {
    const { email } = req.body;


    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Assuming subscribers is an array, you may need to change this logic based on your actual data model
    if (Subscriber.some(subscriber => subscriber.email === email)) {
        return res.status(400).json({ error: 'Email already exists' });
    }

    Subscriber.push({ email });
    res.status(201).json({ message: 'Subscriber added successfully' });
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

        const allSubscribers = await Subscriber.find();

        allSubscribers.forEach(subscriber => {
            worksheet.addRow({ email: subscriber.email });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=subscribers.xlsx');

        return workbook.xlsx.write(res)
            .then(() => {
                res.status(200).end();
            });
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
