import Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://693beaee276e45d1a054454cad869b29@o4510279589625856.ingest.us.sentry.io/4510279754514432',
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
