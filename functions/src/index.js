const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// 1. When a new job is created, send a push notification to all active workers
exports.sendJobAlertToWorkers = functions.firestore
  .document("jobs/{jobId}")
  .onCreate(async (snap, context) => {
    const jobData = snap.data();

    // Only notify if status is 'open' or 'bidding'
    if (jobData.status !== "open" && jobData.status !== "bidding") {
      return null;
    }

    try {
      // Get all workers who have an FCM token saved
      const workersSnapshot = await admin
        .firestore()
        .collection("users")
        .where("role", "==", "worker")
        .get();

      if (workersSnapshot.empty) {
        console.log("No workers found to send notifications to.");
        return null;
      }

      const tokens = [];
      workersSnapshot.forEach((doc) => {
        const user = doc.data();
        if (user.fcmToken) {
          tokens.push(user.fcmToken);
        }
      });

      if (tokens.length === 0) {
        console.log("No workers have FCM tokens registered.");
        return null;
      }

      const title = `🚨 Nayi Job: ${jobData.category}`;
      const body = `💰 Budget: Rs ${jobData.budget}\n📍 Location: ${jobData.location}\n⚡ Open app to bid!`;

      const payload = {
        notification: {
          title: title,
          body: body,
        },
        data: {
          jobId: context.params.jobId,
          type: "new_job",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      };

      const response = await admin.messaging().sendToDevice(tokens, payload);
      console.log("Successfully sent job notifications:", response);
      return response;
    } catch (error) {
      console.error("Error sending job notification:", error);
      return null;
    }
  });

// 2. Chat Message Notification (InDrive Style)
exports.sendChatMessageNotification = functions.firestore
  .document("messages/{messageId}")
  .onCreate(async (snap, context) => {
    const messageData = snap.data();

    try {
      // Get receiver's FCM token
      const userDoc = await admin.firestore().collection("users").doc(messageData.receiverId).get();
      const user = userDoc.data();

      if (!user || !user.fcmToken) {
        return null;
      }

      // Get sender's name
      const senderDoc = await admin.firestore().collection("users").doc(messageData.senderId).get();
      const senderName = senderDoc.data()?.name || "Someone";

      const payload = {
        notification: {
          title: `💬 New Message from ${senderName}`,
          body: messageData.text,
        },
        data: {
          type: "chat_message",
          senderId: messageData.senderId,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      };

      const response = await admin.messaging().sendToDevice([user.fcmToken], payload);
      console.log("Chat notification sent:", response);
      return response;
    } catch (error) {
      console.error("Error sending chat notification:", error);
      return null;
    }
  });

// 3. Incoming Call Notification (WebRTC Alert)
exports.sendCallNotification = functions.firestore
  .document("calls/{callId}")
  .onCreate(async (snap, context) => {
    const callData = snap.data();

    if (callData.status !== "ringing") {
      return null;
    }

    try {
      const userDoc = await admin.firestore().collection("users").doc(callData.receiverId).get();
      const user = userDoc.data();

      if (!user || !user.fcmToken) {
        return null;
      }

      const payload = {
        notification: {
          title: `📞 Incoming Call`,
          body: `${callData.callerName} is calling you. Open app to answer!`,
        },
        data: {
          type: "incoming_call",
          callId: context.params.callId,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      };

      const response = await admin.messaging().sendToDevice([user.fcmToken], payload);
      console.log("Call notification sent:", response);
      return response;
    } catch (error) {
      console.error("Error sending call notification:", error);
      return null;
    }
  });