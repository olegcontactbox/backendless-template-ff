// const functions = require('firebase-functions');

// // // Create and Deploy Your First Cloud Functions
// // // https://firebase.google.com/docs/functions/write-firebase-functions
// //
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

import { mailCredentials } from './../mail-credentials';

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
// Configure the email transport using the default SMTP transport and a GMail account.
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.

// const gmailEmail = functions.config().gmail.email;
// const gmailPassword = functions.config().gmail.password;


const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mailCredentials.gmailEmail,
        pass: mailCredentials.gmailPassword,
    },
});

// Sends an email confirmation when a user changes his mailing list subscription.
exports.sendNewContactMessageEmail = functions.firestore.document('/messages/{uid}').onCreate(async (snap, context) => {
    // const snapshot = change.after;
    //   const val = snapshot.val();
    const dataFromSnap = snap.data();
    console.log(`dataFromSnap: `, dataFromSnap);

    const val = { email: 'null' };
    await admin.firestore().collection('fl_settings').doc('/globals').get().then(doc => { val.email = doc.data().adminEmail })

    const mailOptions = {
        from: '"backendless-template" <backendless.template@gmail.com>',
        to: val.email,
    };

    // Building Email message.
    mailOptions.subject = 'New message from visitor of your site';
    mailOptions.text = `
    You have new message!
    
    Name: ${dataFromSnap.name}
    Email: ${dataFromSnap.email}
    Subject: ${dataFromSnap.subject}
    
    Message: ${dataFromSnap.message}
    `;

    try {
        await mailTransport.sendMail(mailOptions);
        console.log(`New message email sent to:`, val.email);
    } catch (error) {
        console.error('There was an error while sending the email:', error);
    }
    return null;
});

exports.newsCounter = functions.firestore.document('/fl_content/{uid}').onWrite((change, context) => {

    if (!change.before.exists && change.after.data()._fl_meta_.schema === 'news') {
        console.log(`New document Created : add one to count`);
        admin.firestore().collection('counters').doc('/newsCounter').update('value', admin.firestore.FieldValue.increment(1));

        // } else if (change.before.exists && change.after.exists) {
        //     // Updating existing document : Do nothing

    } else if (!change.after.exists && change.before.data()._fl_meta_.schema === 'news') {
        console.log(`Deleting document : subtract one from count`);
        admin.firestore().collection('counters').doc('/newsCounter').update('value', admin.firestore.FieldValue.increment(-1));
    }

    return null;
})