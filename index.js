const express = require('express');
const fs = require('fs');
const moment = require('moment');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const availabilityData = JSON.parse(fs.readFileSync('Availability.json'));

app.get('/doctor-availability', (req, res) => {
    const { date, time } = req.body;

    if (!date || !time || !moment(date, 'YYYY-MM-DD', true).isValid() || !moment(time, 'HH:mm', true).isValid()) {
        return res.status(400).json({ error: 'Invalid date or time format'});
    }

    const requestedDate = moment(date);
    const requestedTime = moment(time, 'HH:mm');

    const availability = availabilityData.availabilityTimings[requestedDate.format('dddd').toLowerCase()];

    if (!availability || availability.length === 0) {
        return res.json({ isAvailable: false, nextAvailableSlot: null });
    }

    const availableSlot = availability.find(slot => {
        const startTime = moment(slot.start, 'HH:mm');
        const endTime = moment(slot.end, 'HH:mm');
        return requestedTime.isSameOrAfter(startTime) && requestedTime.isBefore(endTime);
    });

    if (availableSlot) {
        const finalResponse = {
            isAvailable: true,
        };
        console.log(finalResponse)
        return res.json(finalResponse);
    } else {
        const nextAvailableSlot = availability.find(slot => moment(slot.start, 'HH:mm').isSameOrAfter(requestedTime));

        if (nextAvailableSlot) {
            return res.json({ isAvailable: false, nextAvailableSlot: { date, time: nextAvailableSlot.start } });
        } else {
            const nextDay = requestedDate.add(1, 'day').format('YYYY-MM-DD');
            const nextDayAvailability = availabilityData.availabilityTimings[moment(nextDay).format('dddd').toLowerCase()];
            const nextAvailableSlot = nextDayAvailability[0];
            const finalResponse = {
                isAvailable: false,
                nextAvailableSlot: { date: nextDay, time: nextAvailableSlot.start }
            };
            console.log(finalResponse)
            return res.json(finalResponse);
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
