const mongoose = require('mongoose');
const Notification = require('./models/Notification'); 

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedNotifications = async () => {
  try {
    await Notification.deleteMany(); 
    await Notification.insertMany([
      { message: 'New event added: Summer Festival!' },
      { message: 'Reminder: Meeting with the team tomorrow at 10 AM.' },
      { message: 'Event Update: The workshop on React has been rescheduled.' },
      { message: 'Congratulations! You have been selected for the Coding Bootcamp.' },
      { message: 'New Announcement: The conference venue has changed to Hall 3.' }
    ]);
    console.log('Dummy notifications inserted.');
  } catch (err) {
    console.error('Error inserting notifications:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedNotifications();
