import { Event } from '../models/event.model.js';
import { Club } from '../models/club.model.js';
import { User } from '../models/user.model.js';
import { Registration } from '../models/registration.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({ isActive: true })
      .populate('club', 'name category')
      .populate('organizer', 'name email')
      .populate('registrations')
      .sort({ startDate: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('club', 'name category')
      .populate('organizer', 'name email')
      .populate('registrations');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createEvent = async (req, res) => {
  const { title, description, startDate, endDate, location, club, maxCapacity, eventType, imageUrl, tags } = req.body;
  
  // Debug: Log the received data
  console.log("Received event data:", req.body);
  console.log("Uploaded file:", req.file);
  
  // Get organizer from authenticated user
  const organizer = req.user._id;
  
  // Ensure only faculty can create events
  if (req.user.role !== "faculty") {
    return res.status(403).json({ error: 'Only faculty members can create events' });
  }
  
  const eventStartDate = new Date(startDate);
  const eventEndDate = new Date(endDate);
  const now = new Date();

  // Validation
  if (!title || !description || !startDate || !endDate || !location || !club) {
    console.log("Missing required fields:", { title: !!title, description: !!description, startDate: !!startDate, endDate: !!endDate, location: !!location, club: !!club });
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  if (eventStartDate < now) {
    return res.status(400).json({ error: 'Event start date must be in the future' });
  }

  if (eventEndDate <= eventStartDate) {
    return res.status(400).json({ error: 'Event end date must be after start date' });
  }

  try {
    // Verify that the club exists and the user has permission to create events for it
    const clubDoc = await Club.findById(club);
    if (!clubDoc) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Check if user is the faculty coordinator of the club
    if (!clubDoc.facultyCoordinator.equals(organizer)) {
      return res.status(403).json({ error: 'Only the faculty coordinator can create events for this club' });
    }

    // Handle image upload
    let finalImageUrl = imageUrl; // Use provided URL as default
    
    if (req.file) {
      // If a file was uploaded, upload it to Cloudinary
      console.log("Uploading file to Cloudinary:", req.file.path);
      const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
      
      if (cloudinaryResponse) {
        finalImageUrl = cloudinaryResponse.secure_url;
        console.log("Image uploaded successfully:", finalImageUrl);
      } else {
        console.log("Failed to upload image to Cloudinary");
        // Don't fail the entire request, just continue without image
      }
    }

    const event = new Event({ 
      title, 
      description, 
      startDate: eventStartDate, 
      endDate: eventEndDate, 
      location, 
      club, 
      organizer, // Now set from authenticated user
      maxCapacity, 
      eventType, 
      imageUrl: finalImageUrl, 
      tags 
    });
    await event.save();

    // Add event to club's events array
    await Club.findByIdAndUpdate(club, { $push: { events: event._id } });
    
    // Populate the created event before sending response
    const populatedEvent = await Event.findById(event._id)
      .populate('club', 'name description')
      .populate('organizer', 'name email department');
    
    res.status(201).json(populatedEvent);
  } catch (err) {
    console.error("Error creating event:", err);
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ error: `Validation failed: ${validationErrors.join(', ')}` });
    }
    res.status(500).json({ error: err.message });
  }
};


// edit event backend
export const updateEvent = async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, maxCapacity, eventType, imageUrl, tags } = req.body;
    const { id } = req.params;
    const currentUser = req.user; // From auth middleware
    
    console.log("Updating event with data:", req.body);
    console.log("Uploaded file:", req.file);
    
    // Ensure only faculty can update events
    if (currentUser.role !== "faculty") {
      return res.status(403).json({ error: 'Only faculty members can update events' });
    }

    // Find the event and populate the club information
    const existingEvent = await Event.findById(id).populate('club');
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if the faculty user is the coordinator of the club that owns this event
    if (!existingEvent.club.facultyCoordinator.equals(currentUser._id)) {
      return res.status(403).json({ error: 'Only the faculty coordinator of this club can update this event' });
    }
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (location) updateData.location = location;
    if (maxCapacity !== undefined) updateData.maxCapacity = maxCapacity;
    if (eventType) updateData.eventType = eventType;
    if (tags) updateData.tags = tags;

    // Handle image upload or URL
    if (req.file) {
      // If a file was uploaded, upload it to Cloudinary
      console.log("Uploading file to Cloudinary:", req.file.path);
      const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
      
      if (cloudinaryResponse) {
        updateData.imageUrl = cloudinaryResponse.secure_url;
        console.log("Image uploaded successfully:", updateData.imageUrl);
      } else {
        console.log("Failed to upload image to Cloudinary");
      }
    } else if (imageUrl) {
      // If URL was provided, use it
      updateData.imageUrl = imageUrl;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('club', 'name category')
     .populate('organizer', 'name email');

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(updatedEvent);
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ error: err.message });
  }
};

// the end


//chnaged code started

export const registerForEvent = async (req, res) => {
  const { userId } = req.body;
  const eventId = req.params.eventId;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.isActive) {
      return res.status(400).json({ message: 'Event is not active' });
    }

    // Check if event has reached maximum capacity
    if (event.maxCapacity && event.registrations.length >= event.maxCapacity) {
      return res.status(400).json({ message: 'Event has reached maximum capacity' });
    }

    // Check if user is already registered
    if (event.registrations.includes(userId)) {
      return res.status(409).json({ message: 'User is already registered for this event' });
    }

    // Add user to registrations
    event.registrations.push(userId);
    await event.save();

    const updatedEvent = await Event.findById(eventId)
      .populate('club', 'name category')
      .populate('organizer', 'name email')
      .populate('registrations', 'name email');

    res.status(200).json({
      message: 'Successfully registered for event',
      event: updatedEvent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendReminder = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('registrations', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.registrations || event.registrations.length === 0) {
      return res.status(400).json({ message: 'No registered users found for this event' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const sendMailPromises = event.registrations.map(user => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Reminder for ${event.title}`,
        html: `
          <h2>Event Reminder</h2>
          <p>Hi ${user.name},</p>
          <p>This is a reminder for the upcoming event: <strong>${event.title}</strong></p>
          <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date(event.startDate).toLocaleTimeString()}</p>
          <p><strong>Location:</strong> ${event.location}</p>
          <p><strong>Description:</strong> ${event.description}</p>
          <p>We look forward to seeing you there!</p>
        `
      };
      return transporter.sendMail(mailOptions);
    });

    await Promise.all(sendMailPromises);
    res.status(200).json({ 
      message: 'Reminders sent successfully',
      sentTo: event.registrations.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// this is changed end

export const searchEvents = async (req, res) => {
  const { title, location, eventType, startDate, endDate, tags } = req.query;
  let filter = { isActive: true };

  if (title) {
    filter.title = { $regex: title, $options: 'i' };
  }

  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }

  if (eventType) {
    filter.eventType = eventType;
  }

  if (startDate) {
    filter.startDate = { $gte: new Date(startDate) };
  }

  if (endDate) {
    filter.endDate = { $lte: new Date(endDate) };
  }

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    filter.tags = { $in: tagArray };
  }

  try {
    const events = await Event.find(filter)
      .populate('club', 'name category')
      .populate('organizer', 'name email')
      .sort({ startDate: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user; // From auth middleware

    // Ensure only faculty can delete events
    if (currentUser.role !== "faculty") {
      return res.status(403).json({ error: 'Only faculty members can delete events' });
    }

    // Find the event and populate the club information
    const event = await Event.findById(id).populate('club');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if the faculty user is the coordinator of the club that owns this event
    if (!event.club.facultyCoordinator.equals(currentUser._id)) {
      return res.status(403).json({ error: 'Only the faculty coordinator of this club can delete this event' });
    }

    // Remove event from club's events array
    await Club.findByIdAndUpdate(event.club._id, { $pull: { events: id } });

    // Delete the event
    await Event.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get events by club
export const getEventsByClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const events = await Event.find({ club: clubId, isActive: true })
      .populate('club', 'name category')
      .populate('organizer', 'name email')
      .populate('registrations', 'name email')
      .sort({ startDate: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get events by organizer
export const getEventsByOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const events = await Event.find({ organizer: organizerId })
      .populate('club', 'name category')
      .populate('organizer', 'name email')
      .populate('registrations', 'name email')
      .sort({ startDate: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// changed  part start
// Unregister from event
export const unregisterFromEvent = async (req, res) => {
  const { userId } = req.body;
  const eventId = req.params.eventId;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is registered
    if (!event.registrations.includes(userId)) {
      return res.status(400).json({ message: 'User is not registered for this event' });
    }

    // Remove user from registrations
    event.registrations = event.registrations.filter(id => id.toString() !== userId);
    await event.save();

    res.status(200).json({ 
      message: 'Successfully unregistered from event',
      event 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// changed part  end

// Get upcoming events
export const getUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({ 
      startDate: { $gt: now }, 
      isActive: true 
    })
      .populate('club', 'name category')
      .populate('organizer', 'name email')
      .sort({ startDate: 1 })
      .limit(10);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Deactivate event (soft delete)
export const deactivateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user; // From auth middleware

    // Ensure only faculty can deactivate events
    if (currentUser.role !== "faculty") {
      return res.status(403).json({ error: 'Only faculty members can deactivate events' });
    }

    // Find the event and populate the club information
    const existingEvent = await Event.findById(id).populate('club');
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if the faculty user is the coordinator of the club that owns this event
    if (!existingEvent.club.facultyCoordinator.equals(currentUser._id)) {
      return res.status(403).json({ error: 'Only the faculty coordinator of this club can deactivate this event' });
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).populate('club', 'name category')
     .populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({ 
      message: 'Event deactivated successfully',
      event 
    });
  } catch (err) {
    console.error('Error deactivating event:', err);
    res.status(500).json({ error: err.message });
  }
};