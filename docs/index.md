---
title: Overview
layout: home
nav_order: 1
---

The Date Wave application is designed to facilitate the exchange of messages between various applications such as IoT Hub, Event Hub, Service Bus, MQTT, and Kafka. The application is currently capable of sending and receiving messages from these services, and in the future, there may be more services added to the list. This feature can be beneficial during the development process as it allows for basic testing of services and applications

The Date Wave application also enables users to prepare messages using pre-defined templates and send them periodically or at specific time intervals. Additionally, the application can consume messages from the aforementioned services and display them, providing users with a way to view the messages being received by the application. Overall, the Date Wave application is a valuable tool for facilitating message exchange and monitoring during the development process.

---

### **Supported Services**

Please find the supported services below

| Service | Send | Send as Bulk | Receive 
|:---:|:---:|:---:|:---:|
| IoT Hub | ✔️ | ✔️ | ✔️ 
| Event Hub | ✔️ | ✔️ | ✔️ 
| Service Bus | ✔️ | ✔️ | ✔️ 
| MQTT | ✔️ | ⭕️ | ✔️ 
| Kafka | 🔷 | ⭕️ | 🔷 


Please find the supported message components below

| Service | Message body | Message Header | Message Properties 
|:---:|:---:|:---:|:---:|
| IoT Hub | ✔️ | ✔️ | ✔️ 
| Event Hub | ✔️ | ✔️ | ✔️ 
| Service Bus | ✔️ | ✔️ | ✔️ 
| MQTT | ✔️ | ⭕️ | ⭕️
| Kafka | 🔷 | ⭕️ | ⭕️ 

---

✔️ Available &emsp; | &emsp; ⭕️ Not available &emsp; | &emsp; ❌ Not implemented &emsp; | &emsp; 🔷 Coming soon

---

### **External libraries** 

External libraries we are using in our applications

| Package Name | Version |
|---|---|
| @azure/event-hubs | 5.9.0 |
| @azure/eventhubs-checkpointstore-blob | 1.0.1 |
| @azure/service-bus | 7.8.1 |
| @azure/storage-blob | 12.13.0 |
| async-mqtt | 2.6.3 |
| azure-iot-device | 1.18.1 |
| azure-iot-device-amqp | 1.14.2 |
| azure-iot-device-http | 1.14.1 |
| azure-iot-device-mqtt | 1.16.1 |
| bulma | 0.9.4 |
| chart.js | 4.2.1 |
| chartjs-adapter-moment | 1.0.1 |
| jquery | 3.6.4 |
| kafkajs | 2.2.4 |
| moment | 2.29.4 |
| uuid | 9.0.0 |


### **Releases** 


Release | Date | Changes
|---|---|---|
1.0.0 | | Initial Version