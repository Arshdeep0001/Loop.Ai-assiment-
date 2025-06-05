const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// Priority levels
const Priority = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
};

// Queue to store jobs
const jobQueue = [];
let isProcessing = false;

// Store ingestion status
const ingestionStatus = new Map();

// Function to simulate external API call
const fetchDataFromExternalAPI = async (id) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ id, data: "processed" });
        }, 1000); // Simulate 1 second delay
    });
};

// Process jobs from the queue
const processJobs = async () => {
    if (isProcessing || jobQueue.length === 0) return;

    isProcessing = true;
    const currentJob = jobQueue[0];
    const currentBatch = currentJob.ids.slice(0, 3);
    const remainingIds = currentJob.ids.slice(3);

    console.log(`Processing batch: ${currentBatch.join(', ')} with priority ${currentJob.priority}`);

    // Create a new batch
    const batchId = uuidv4();
    const batch = {
        batch_id: batchId,
        ids: currentBatch,
        status: 'triggered'
    };

    // Update ingestion status
    if (!ingestionStatus.has(currentJob.ingestionId)) {
        ingestionStatus.set(currentJob.ingestionId, {
            ingestion_id: currentJob.ingestionId,
            status: 'yet_to_start',
            batches: []
        });
    }

    const status = ingestionStatus.get(currentJob.ingestionId);
    status.batches.push(batch);
    status.status = 'triggered';

    // Process the current batch
    await Promise.all(currentBatch.map(id => fetchDataFromExternalAPI(id)));

    // Update batch status to completed
    batch.status = 'completed';

    // Update overall status
    const allCompleted = status.batches.every(b => b.status === 'completed');
    if (allCompleted) {
        status.status = 'completed';
    }

    // Remove processed IDs from the queue
    if (remainingIds.length > 0) {
        currentJob.ids = remainingIds;
    } else {
        jobQueue.shift();
    }

    isProcessing = false;

    // Wait for 5 seconds before processing next batch
    setTimeout(() => {
        processJobs();
    }, 5000);
};

// Sort jobs based on priority and creation time
const sortJobs = () => {
    jobQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
            return b.priority - a.priority;
        }
        return a.createdAt - b.createdAt;
    });
};

// Ingestion endpoint
app.post('/ingest', (req, res) => {
    const { ids, priority } = req.body;

    // Validate input
    if (!ids || !Array.isArray(ids) || !priority || !Object.values(Priority).includes(Priority[priority])) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    // Validate ID range
    if (ids.some(id => id < 1 || id > 1e9 + 7)) {
        return res.status(400).json({ error: 'IDs must be between 1 and 10^9 + 7' });
    }

    const ingestionId = uuidv4();
    
    // Add to queue
    jobQueue.push({
        ids,
        priority: Priority[priority],
        createdAt: Date.now(),
        ingestionId
    });

    // Initialize status
    ingestionStatus.set(ingestionId, {
        ingestion_id: ingestionId,
        status: 'yet_to_start',
        batches: []
    });

    // Sort queue
    sortJobs();

    // Start processing if not already processing
    if (!isProcessing) {
        processJobs();
    }

    res.json({ ingestion_id: ingestionId });
});

// Status endpoint
app.get('/status/:ingestionId', (req, res) => {
    const { ingestionId } = req.params;
    const status = ingestionStatus.get(ingestionId);

    if (!status) {
        return res.status(404).json({ error: 'Ingestion ID not found' });
    }

    res.json(status);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});