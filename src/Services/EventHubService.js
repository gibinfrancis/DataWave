const { EventHubProducerClient } = require("@azure/event-hubs");

const connectionString = "EVENT HUBS NAMESPACE CONNECTION STRING";
const eventHubName = "EVENT HUB NAME";

async function main() {
  // Create a producer client to send messages to the event hub.
  const producer = new EventHubProducerClient(connectionString, eventHubName);

  // Prepare a batch of three events.
  const batch = await producer.createBatch();
  batch.tryAdd({ body: "First event" });
  batch.tryAdd({ body: "Second event" });
  batch.tryAdd({ body: "Third event" });

  // Send the batch to the event hub.
  await producer.sendBatch(batch);

  // Close the producer client.
  await producer.close();

  console.log("A batch of three events have been sent to the event hub");
}

main().catch((err) => {
  console.log("Error occurred: ", err);
});

const {
  EventHubConsumerClient,
  earliestEventPosition,
} = require("@azure/event-hubs");
const { ContainerClient } = require("@azure/storage-blob");
const {
  BlobCheckpointStore,
} = require("@azure/eventhubs-checkpointstore-blob");

const connectionString = "EVENT HUBS NAMESPACE CONNECTION STRING";
const eventHubName = "EVENT HUB NAME";
const consumerGroup = "$Default"; // name of the default consumer group
const storageConnectionString = "STORAGE CONNECTION STRING";
const containerName = "STORAGE CONTAINER NAME";

async function main() {
  // Create a blob container client and a blob checkpoint store using the client.
  const containerClient = new ContainerClient(
    storageConnectionString,
    containerName
  );
  const checkpointStore = new BlobCheckpointStore(containerClient);

  // Create a consumer client for the event hub by specifying the checkpoint store.
  const consumerClient = new EventHubConsumerClient(
    consumerGroup,
    connectionString,
    eventHubName,
    checkpointStore
  );

  // Subscribe to the events, and specify handlers for processing the events and errors.
  const subscription = consumerClient.subscribe(
    {
      processEvents: async (events, context) => {
        if (events.length === 0) {
          console.log(
            `No events received within wait time. Waiting for next interval`
          );
          return;
        }

        for (const event of events) {
          console.log(
            `Received event: '${event.body}' from partition: '${context.partitionId}' and consumer group: '${context.consumerGroup}'`
          );
        }
        // Update the checkpoint.
        await context.updateCheckpoint(events[events.length - 1]);
      },

      processError: async (err, context) => {
        console.log(`Error : ${err}`);
      },
    },
    { startPosition: earliestEventPosition }
  );

  // After 30 seconds, stop processing.
  await new Promise((resolve) => {
    setTimeout(async () => {
      await subscription.close();
      await consumerClient.close();
      resolve();
    }, 30000);
  });
}

main().catch((err) => {
  console.log("Error occurred: ", err);
});