---
title: Windows
layout: home
nav_order: 5
---


### **Message area** 

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


## **Logs logs**

This section displays the logs from the application, and you can control your logs with the following functionalities:

*Please find the screenshot below*

![Message Explorer](./images/ss_logoptions.jpg)

### **Scroll To bottom**
Click this button to display and scroll to the bottom of the logs.

### **Detailed Logs**
Click this button to display detailed logs.

### **Messages**
Click this button to display message contents.

---

## **Actions area**

These actions allow you to perform necessary operations on the application:

*Please find the screenshot below*

![Message Explorer](./images/ss_actions.jpg)

### **Save Json**
Saves the current run's JSON file, including all settings and parameters, for future use.

### **Upload Json**
Uploads a saved JSON file to the window and updates settings and parameters accordingly.

### **Reset**
Restarts the window.

### **Hide/View Message**
Hides or shows the message template section of the window. This is useful when receiving messages and you want to see the logs section on the full area. You can optionally drag the right bottom corner of the logs section to resize it according to your needs.

