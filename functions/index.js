const functions = require('firebase-functions');

const {
  logout,
  login,
  checkDakaDay,
  daka,
  getSession,
} = require('./daka/src/daka.js');

let retryCount = 0;

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const main = async () => {
  const USERNAME = process.env.FEMAS_USERNAME;
  const PASSWORD = process.env.FEMAS_PASSWORD;
  const DOMAIN = process.env.FEMAS_DOMAIN;
  const MAX_RETRY_COUNT = process.env.MAX_RETRY_COUNT;

  console.log('===== start =====');
  console.log(
    'username: ',
    USERNAME,
    'password: ',
    PASSWORD,
    'domain: ',
    DOMAIN
  );
  let session = '';

  try {
    getSessionResponse = await getSession({ domain: DOMAIN });
    session = getSessionResponse.session;

    const { ClockRecordUserId, AttRecordUserId } = await login({
      session,
      domain: DOMAIN,
      username: USERNAME,
      password: PASSWORD,
    });

    const isDakaDay = await checkDakaDay({ session, domain: DOMAIN });

    if (isDakaDay) {
      await daka({
        session,
        domain: DOMAIN,
        ClockRecordUserId,
        AttRecordUserId,
      });
    }
    retryCount = 0;
  } catch (e) {
    console.log('Error:', e);

    if (retryCount < MAX_RETRY_COUNT) {
      console.log('Some error happen, retry in 3 secs');
      retryCount += 1;
      await logout({ session, domain: DOMAIN });
      setTimeout(main, 3000);
    } else {
      throw e;
    }
  }
  logout({ session, domain: DOMAIN });
  console.log('===== end =====');
};

// exports.test = functions
//   .runWith({ secrets: ['FEMAS_USERNAME', 'FEMAS_PASSWORD'] })
//   .https.onRequest(async (request, response) => {
//     main();
//     return response.send('ok');
//   });

exports.daka = functions
  .runWith({ secrets: ['FEMAS_USERNAME', 'FEMAS_PASSWORD'] })
  .pubsub.schedule('13 10,19 * * *')
  .timeZone('Asia/Taipei')
  .onRun(async (context) => {
    main();
  });
