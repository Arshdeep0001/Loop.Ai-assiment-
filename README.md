# Priority-Based Job Ingestion API

This is a Node.js and Express-based API for simulating a job ingestion and processing system. It supports priority-based job queuing, batching, and asynchronous processing with real-time status tracking.

## Features

- Accepts job ingestion requests with different priority levels (HIGH, MEDIUM, LOW).
- Processes jobs in batches of 3 with simulated external API calls.
- Prioritizes jobs based on priority and submission time.
- Tracks ingestion status and batch completion.
- Status endpoint to monitor ingestion progress.

---

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
2. Install dependencies
   npm install
3. Start the server:
   node index.js

### API Endpoints
1. Ingest Jobs
    POST /ingest
   {
  "ids": [1, 2, 3, 4, 5],
  "priority": "HIGH" // or "MEDIUM" or "LOW"
   }

   ids: Array of integers between 1 and 1e9+7
   priority: Job priority ("HIGH", "MEDIUM", or "LOW")

   Response
   {
  "ingestion_id": "generated-uuid"
   }

2. Get Ingestion Status
GET /status/:ingestionId

Example:
GET /status/4fd1a1c9-6dcb-4e55-85f2-1f6a08f1e4c0

Response:

{
  "ingestion_id": "4fd1a1c9-6dcb-4e55-85f2-1f6a08f1e4c0",
  "status": "triggered", // or "yet_to_start", "completed"
  "batches": [
    {
      "batch_id": "batch-uuid",
      "ids": [1, 2, 3],
      "status": "completed"
    },
    ...
  ]
}

### Notes
Each batch is processed with a 1-second delay (simulated external API call).

There is a 5-second delay between batches.

Maximum of 3 IDs per batch.

