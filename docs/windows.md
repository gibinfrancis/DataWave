---
title: Windows
layout: home
nav_order: 5
---


### **Message** 

you can provide message content in multiple pasts, some services have headers and properties in message to enhance the message, you can use the relative session to provide those details. make sure that the headers and properties will be a single leveled json.

### **Message Template** 

Here you can provide your static or template based message that will be used to send.

### **Message Header Template** 

Here you can provide your static or template based message header that will be used to send as part of the message. you should provide the header in below format

```
{
  "HeaderNodeId": "{{HeaderNodeId}}",
  "HeaderApplicationUri": "{{ApplicationUri}}",
  "HeaderDisplayName": "HardValue"
}
```

### **Message Properties Template** 

Here you can provide your static or template based message properties that will be used to send as part of the message. you should provide the properties in below format. There are a handful properties available for the services, other that will not give any effect even if you provide them

```
{
  "HeaderNodeId": "{{HeaderNodeId}}",
  "HeaderApplicationUri": "{{ApplicationUri}}",
  "HeaderDisplayName": "HardValue"
}
```




## **Logs**

This section displays the logs from the application, and you can control your logs with the following functionalities:

*Please find the screenshot below*

![Message Explorer](./images/ss_actions.jpg)

### **Scroll To bottom**
Click this button to display and scroll to the bottom of the logs.

### **Detailed Logs**
Click this button to display detailed logs.

### **Messages**
Click this button to display message contents.